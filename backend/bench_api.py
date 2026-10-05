# ───────────────────────────────────────────────────────────────
# backend/bench_api.py
# Benchmark simples da API KaorCount (FastAPI/uvicorn).
#
# Mede latência (p50/p95/p99, min/máx/média) e throughput (req/s)
# dos principais endpoints, com warmup e execução concorrente.
# Uso:
#   cd backend
#   python -m uvicorn app.main:app --host 127.0.0.1 --port 8010
#   python bench_api.py --base http://127.0.0.1:8010/api/v1
# ───────────────────────────────────────────────────────────────
import argparse
import asyncio
import statistics
import time
import uuid

import httpx


def pct(valores, q):
    """Percentil com interpolação simples."""
    if not valores:
        return float("nan")
    vs = sorted(valores)
    k = (len(vs) - 1) * q
    f, c = int(k), min(int(k) + 1, len(vs) - 1)
    return vs[f] + (vs[c] - vs[f]) * (k - f)


class Bench:
    def __init__(self, base_url, concorrencia):
        self.base_url = base_url.rstrip("/")
        self.concorrencia = concorrencia
        self.token = None
        self.id_usuario = None

    async def _chama(self, client, metodo, path, **kwargs):
        url = self.base_url + path
        # ↓ Endpoints fora do prefixo /api/v1 (ex.: /health) usam caminho absoluto.
        if path.startswith("/../"):
            url = self.base_url.replace("/api/v1", "") + path[3:]
        inicio = time.perf_counter()
        try:
            resp = await client.request(metodo, url, **kwargs)
            return (time.perf_counter() - inicio) * 1000.0, resp.status_code
        except Exception:
            return (time.perf_counter() - inicio) * 1000.0, 0

    def _relatorio(self, nome, latencias, status, segundos):
        ok = sum(1 for s in status if 200 <= s < 300)
        erros = len(status) - ok
        media = statistics.fmean(latencias) if latencias else float("nan")
        print(f"\n> {nome}")
        print(f"    requisicoes: {len(latencias)}  ok: {ok}  erros: {erros}")
        print(f"    min: {min(latencias):.1f} ms  media: {media:.1f} ms  "
              f"p50: {pct(latencias, .50):.1f} ms  p95: {pct(latencias, .95):.1f} ms  "
              f"p99: {pct(latencias, .99):.1f} ms  max: {max(latencias):.1f} ms")
        print(f"    throughput: {len(latencias) / segundos:.1f} req/s")
        return {"endpoint": nome, "n": len(latencias), "ok": ok, "erros": erros,
                "p50_ms": round(pct(latencias, .5), 1), "p95_ms": round(pct(latencias, .95), 1),
                "media_ms": round(media, 1), "rps": round(len(latencias) / segundos, 1)}

    async def _runner(self, metodo, path, n, writer=None, auth=False):
        limit = asyncio.Semaphore(self.concorrencia)
        headers = {}
        if auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        latencias, status = [], []
        async with httpx.AsyncClient(timeout=30.0) as client:
            async def worker(i):
                async with limit:
                    kwargs = dict(headers=headers) if headers else {}
                    if writer:
                        kwargs.update(writer(i))
                    lat, st = await self._chama(client, metodo, path, **kwargs)
                    latencias.append(lat)
                    status.append(st)
            t0 = time.perf_counter()
            tarefas = [asyncio.create_task(worker(i)) for i in range(n)]
            await asyncio.gather(*tarefas)
            segs = time.perf_counter() - t0
        return latencias, status, segs

    async def setup(self):
        # Usuário descartável para autenticar durante o benchmark.
        email = f"bench-{uuid.uuid4().hex[:8]}@example.com"
        dados = {"nome": "Bench User", "email": email, "senha": "bench123456"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(self.base_url + "/auth/registrar", json=dados)
            r.raise_for_status()
            r = await client.post(self.base_url + "/auth/login",
                                  json={"email": email, "senha": "bench123456"})
            r.raise_for_status()
            body = r.json()
        self.token = body.get("access_token")
        # ↓ Login retorna só o token; o id do usuário vem de /auth/me.
        if self.token:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.get(self.base_url + "/auth/me",
                                     headers={"Authorization": f"Bearer {self.token}"})
                r.raise_for_status()
                self.id_usuario = r.json().get("id_usuario")
        self._email_bench, self._senha_bench = email, "bench123456"

    async def _bench_item(self, nome, metodo, path, n, writer=None, auth=False):
        lat, st, segs = await self._runner(metodo, path, n, writer=writer, auth=auth)
        return self._relatorio(nome, lat, st, segs)

    async def run(self, iters):
        resultados = []
        print("\n-- warmup (10 req) --")
        lat, _, _ = await self._runner("GET", "/../health", 10)
        print(f"    ok ({len(lat)} req, media de {statistics.fmean(lat):.1f} ms)")

        resultados.append(await self._bench_item("GET /health", "GET", "/../health", iters))
        resultados.append(await self._bench_item("POST /auth/login", "POST", "/auth/login", iters,
                          writer=lambda i: {"json": {"email": self._email_bench, "senha": self._senha_bench}}))
        resultados.append(await self._bench_item("GET /alimentos/ (paginado)", "GET",
                          "/alimentos/?skip=0&limit=20", iters, auth=True))
        if self.id_usuario:
            resultados.append(await self._bench_item("GET /historico-progresso/usuario/{id}", "GET",
                              f"/historico-progresso/usuario/{self.id_usuario}", iters, auth=True))
            resultados.append(await self._bench_item("GET /metas-nutri/usuario/{id}/atual", "GET",
                              f"/metas-nutri/usuario/{self.id_usuario}/atual", iters, auth=True))
        else:
            print("  [aviso] sem id_usuario — pulando endpoints autenticados extras")
        return resultados


async def main():
    ap = argparse.ArgumentParser(description="Benchmark da API KaorCount")
    ap.add_argument("--base", default="http://127.0.0.1:8010/api/v1")
    ap.add_argument("--iters", type=int, default=200)
    ap.add_argument("--concorrencia", type=int, default=10)
    args = ap.parse_args()

    b = Bench(args.base, args.concorrencia)
    await b.setup()
    print(f"\n=== Benchmark ({args.iters} req x concorrencia {args.concorrencia}) ===")
    res = await b.run(args.iters)
    print("\n=== Resumo ===")
    for r in res:
        print(f"  {r['endpoint']:44s} media {r['media_ms']:>7.1f} ms  "
              f"p95 {r['p95_ms']:>7.1f} ms  {r['rps']:>7.1f} req/s  erros {r['erros']}")


if __name__ == "__main__":
    asyncio.run(main())

