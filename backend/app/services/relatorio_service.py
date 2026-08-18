from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.repositories.registro_agua_repo import RegistroAguaRepository
from app.repositories.historico_progresso_repo import HistoricoProgressoRepository
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.models.refeicao import Refeicao
from app.models.item_refeicao import ItemRefeicao
from app.models.alimento import Alimento

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
)
from io import BytesIO


class RelatorioService:

    def __init__(self, db: Session):
        self.db = db
        self.agua_repo = RegistroAguaRepository(db)
        self.progresso_repo = HistoricoProgressoRepository(db)
        self.meta_repo = MetaNutriRepository(db)

    # -- coleta de dados --

    def _macros_por_dia(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[dict]:
        """Calorias e macros consumidos por cada dia do período."""
        if data_inicio > data_fim:
            raise ValueError("data_inicio deve ser menor ou igual a data_fim")
        
        # Query otimizada: busca todos os itens do período em uma única query com join
        itens = (
            self.db.query(
                Refeicao.data_refeicao,
                func.sum(
                    (ItemRefeicao.quantidade_alimento_g / Alimento.porcao_padrao_g) * Alimento.calorias
                ).label("calorias"),
                func.sum(
                    (ItemRefeicao.quantidade_alimento_g / Alimento.porcao_padrao_g) * Alimento.carboidratos
                ).label("carboidratos"),
                func.sum(
                    (ItemRefeicao.quantidade_alimento_g / Alimento.porcao_padrao_g) * Alimento.proteinas
                ).label("proteinas"),
                func.sum(
                    (ItemRefeicao.quantidade_alimento_g / Alimento.porcao_padrao_g) * Alimento.gorduras
                ).label("gorduras"),
                func.count(Refeicao.id_refeicao.distinct()).label("refeicoes"),
            )
            .join(ItemRefeicao, ItemRefeicao.id_refeicao == Refeicao.id_refeicao)
            .join(Alimento, Alimento.id_alimento == ItemRefeicao.id_alimento)
            .filter(
                Refeicao.id_usuario == str(id_usuario),
                Refeicao.data_refeicao >= data_inicio,
                Refeicao.data_refeicao <= data_fim,
                Alimento.porcao_padrao_g > 0,
            )
            .group_by(Refeicao.data_refeicao)
            .all()
        )
        
        # Mapear resultados por data
        macros_por_data = {}
        for item in itens:
            macros_por_data[str(item.data_refeicao)] = {
                "calorias": round(float(item.calorias or 0), 2),
                "carboidratos": round(float(item.carboidratos or 0), 2),
                "proteinas": round(float(item.proteinas or 0), 2),
                "gorduras": round(float(item.gorduras or 0), 2),
                "refeicoes": int(item.refeicoes or 0),
            }
        
        # Preencher todos os dias do período (incluindo dias sem refeições)
        dias = []
        dia = data_inicio
        while dia <= data_fim:
            data_str = str(dia)
            if data_str in macros_por_data:
                m = macros_por_data[data_str]
                dias.append({
                    "data": data_str,
                    "calorias": m["calorias"],
                    "carboidratos": m["carboidratos"],
                    "proteinas": m["proteinas"],
                    "gorduras": m["gorduras"],
                    "refeicoes": m["refeicoes"],
                })
            else:
                dias.append({
                    "data": data_str,
                    "calorias": 0.0,
                    "carboidratos": 0.0,
                    "proteinas": 0.0,
                    "gorduras": 0.0,
                    "refeicoes": 0,
                })
            dia += timedelta(days=1)
        return dias

    def _agua_por_dia(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[dict]:
        """Total de ml de água ingerido por dia no período."""
        if data_inicio > data_fim:
            raise ValueError("data_inicio deve ser menor ou igual a data_fim")
        
        from app.models.registro_agua import RegistroAgua
        from sqlalchemy import func
        
        # Query otimizada: busca todos os totais do período em uma única query
        resultados = (
            self.db.query(
                RegistroAgua.data_registro,
                func.sum(RegistroAgua.quantidade_ml).label("total_ml"),
            )
            .filter(
                RegistroAgua.id_usuario == str(id_usuario),
                RegistroAgua.data_registro >= data_inicio,
                RegistroAgua.data_registro <= data_fim,
            )
            .group_by(RegistroAgua.data_registro)
            .all()
        )
        
        # Mapear resultados por data
        agua_por_data = {}
        for r in resultados:
            agua_por_data[str(r.data_registro)] = round(float(r.total_ml or 0), 2)
        
        # Preencher todos os dias do período
        dias = []
        dia = data_inicio
        while dia <= data_fim:
            data_str = str(dia)
            dias.append({
                "data": data_str,
                "agua_ml": agua_por_data.get(data_str, 0.0),
            })
            dia += timedelta(days=1)
        return dias

    def _evolucao_peso(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[dict]:
        """Registros de peso no período, em ordem cronológica."""
        historico = self.db.query(
            self.progresso_repo.model
        ).filter(
            self.progresso_repo.model.id_usuario == str(id_usuario),
            self.progresso_repo.model.data_registro >= data_inicio,
            self.progresso_repo.model.data_registro <= data_fim,
        ).order_by(self.progresso_repo.model.data_registro).all()

        return [
            {"data": str(h.data_registro), "peso_kg": h.peso_atual}
            for h in historico
        ]

    def _resumo_periodo(self, dias_macros: list[dict], dias_agua: list[dict]) -> dict:
        """Totais agregados do período."""
        total_cal = sum(d["calorias"] for d in dias_macros)
        total_agua = sum(d["agua_ml"] for d in dias_agua)
        num_dias = len(dias_macros)
        media_cal = round(total_cal / num_dias, 2) if num_dias else 0

        return {
            "dias_no_periodo": num_dias,
            "total_calorias": round(total_cal, 2),
            "media_calorias_dia": media_cal,
            "total_agua_ml": round(total_agua, 2),
            "media_agua_dia_ml": round(total_agua / num_dias, 2) if num_dias else 0,
        }

    # -- geração do PDF --

    def gerar_relatorio_pdf(
        self,
        id_usuario: UUID | str,
        nome_usuario: str,
        data_inicio: date,
        data_fim: date,
    ) -> bytes:
        """Gera um relatório de progresso em PDF e retorna os bytes."""
        if data_inicio > data_fim:
            raise ValueError("data_inicio deve ser menor ou igual a data_fim")
            
        meta = self.meta_repo.get_meta_atual(id_usuario)
        dias_macros = self._macros_por_dia(id_usuario, data_inicio, data_fim)
        dias_agua = self._agua_por_dia(id_usuario, data_inicio, data_fim)
        evolucao = self._evolucao_peso(id_usuario, data_inicio, data_fim)
        resumo = self._resumo_periodo(dias_macros, dias_agua)

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
            title=f"Relatório KaorCount — {nome_usuario}",
        )
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="TituloRelatorio",
            parent=styles["Title"],
            fontSize=20,
            textColor=colors.HexColor("#2E7D32"),
            spaceAfter=6,
            alignment=TA_CENTER,
        ))
        styles.add(ParagraphStyle(
            name="SubtituloRelatorio",
            parent=styles["Normal"],
            fontSize=11,
            textColor=colors.HexColor("#666666"),
            alignment=TA_CENTER,
            spaceAfter=18,
        ))
        styles.add(ParagraphStyle(
            name="SecaoTitulo",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#2E7D32"),
            spaceBefore=14,
            spaceAfter=6,
        ))

        elementos = []

        # Cabeçalho
        elementos.append(Paragraph("KaorCount — Relatório de Progresso", styles["TituloRelatorio"]))
        elementos.append(Paragraph(
            f"Usuário: {nome_usuario}  |  Período: {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}",
            styles["SubtituloRelatorio"],
        ))

        # Meta nutricional atual
        elementos.append(Paragraph("Meta Nutricional Atual", styles["SecaoTitulo"]))
        if meta:
            dados_meta = [
                ["Calorias/dia", "Carboidratos (g)", "Proteínas (g)", "Gorduras (g)"],
                [
                    f"{meta.calorias_diarias:.0f}",
                    f"{meta.carboidrato_g:.0f}",
                    f"{meta.proteina_g:.0f}",
                    f"{meta.gordura_g:.0f}",
                ],
            ]
        else:
            dados_meta = [["Meta nutricional não definida"], ["—"]]

        tabela_meta = Table(dados_meta, colWidths=[4.5 * cm] * 4)
        tabela_meta.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F1F8E9"), colors.white]),
        ]))
        elementos.append(tabela_meta)

        # Resumo do período
        elementos.append(Paragraph("Resumo do Período", styles["SecaoTitulo"]))
        dados_resumo = [
            ["Indicador", "Valor"],
            ["Dias no período", f"{resumo['dias_no_periodo']}"],
            ["Total de calorias consumidas", f"{resumo['total_calorias']:.0f} kcal"],
            ["Média de calorias/dia", f"{resumo['media_calorias_dia']:.0f} kcal"],
            ["Total de água ingerida", f"{resumo['total_agua_ml']:.0f} ml"],
            ["Média de água/dia", f"{resumo['media_agua_dia_ml']:.0f} ml"],
        ]
        tabela_resumo = Table(dados_resumo, colWidths=[9 * cm, 9 * cm])
        tabela_resumo.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F1F8E9"), colors.white]),
        ]))
        elementos.append(tabela_resumo)

        # Consumo diário de calorias
        elementos.append(Paragraph("Consumo Diário de Calorias e Macros", styles["SecaoTitulo"]))
        header = ["Data", "Calorias", "Carbo (g)", "Proteína (g)", "Gordura (g)", "Refeições"]
        linhas = [header]
        for d in dias_macros:
            linhas.append([
                d["data"][8:10] + "/" + d["data"][5:7],
                f"{d['calorias']:.0f}",
                f"{d['carboidratos']:.1f}",
                f"{d['proteinas']:.1f}",
                f"{d['gorduras']:.1f}",
                str(d["refeicoes"]),
            ])
        tabela_dias = Table(linhas, colWidths=[2.5 * cm, 2.5 * cm, 2.5 * cm, 3 * cm, 3 * cm, 3.5 * cm])
        tabela_dias.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F1F8E9"), colors.white]),
        ]))
        elementos.append(tabela_dias)

        # Consumo de água
        elementos.append(Paragraph("Ingestão de Água por Dia", styles["SecaoTitulo"]))
        header_agua = ["Data", "Água (ml)"]
        linhas_agua = [header_agua]
        for d in dias_agua:
            linhas_agua.append([d["data"][8:10] + "/" + d["data"][5:7], f"{d['agua_ml']:.0f}"])
        tabela_agua = Table(linhas_agua, colWidths=[5 * cm, 5 * cm])
        tabela_agua.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1565C0")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#E3F2FD"), colors.white]),
        ]))
        elementos.append(tabela_agua)

        # Evolução de peso
        if evolucao:
            elementos.append(Paragraph("Evolução de Peso", styles["SecaoTitulo"]))
            header_peso = ["Data", "Peso (kg)"]
            linhas_peso = [header_peso]
            for e in evolucao:
                linhas_peso.append([e["data"][8:10] + "/" + e["data"][5:7], f"{e['peso_kg']:.1f}"])
            tabela_peso = Table(linhas_peso, colWidths=[5 * cm, 5 * cm])
            tabela_peso.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EF6C00")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FFF3E0"), colors.white]),
            ]))
            elementos.append(tabela_peso)

        # Rodapé
        elementos.append(Spacer(1, 20))
        elementos.append(Paragraph(
            f"Relatório gerado em {date.today().strftime('%d/%m/%Y')} pelo sistema KaorCount.",
            ParagraphStyle(
                name="Rodape",
                parent=styles["Normal"],
                fontSize=8,
                textColor=colors.HexColor("#999999"),
                alignment=TA_CENTER,
            ),
        ))

        doc.build(elementos)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    # -- endpoint JSON alternativo --

    def gerar_dados_relatorio(
        self,
        id_usuario: UUID | str,
        data_inicio: date,
        data_fim: date,
    ) -> dict:
        """Retorna os dados do relatório em formato JSON (sem gerar PDF)."""
        if data_inicio > data_fim:
            raise ValueError("data_inicio deve ser menor ou igual a data_fim")
            
        meta = self.meta_repo.get_meta_atual(id_usuario)
        dias_macros = self._macros_por_dia(id_usuario, data_inicio, data_fim)
        dias_agua = self._agua_por_dia(id_usuario, data_inicio, data_fim)
        evolucao = self._evolucao_peso(id_usuario, data_inicio, data_fim)
        resumo = self._resumo_periodo(dias_macros, dias_agua)

        return {
            "id_usuario": str(id_usuario),
            "periodo": {"data_inicio": str(data_inicio), "data_fim": str(data_fim)},
            "meta_nutricional": {
                "calorias_diarias": meta.calorias_diarias if meta else None,
                "carboidrato_g": meta.carboidrato_g if meta else None,
                "proteina_g": meta.proteina_g if meta else None,
                "gordura_g": meta.gordura_g if meta else None,
            } if meta else None,
            "resumo": resumo,
            "consumo_diario": dias_macros,
            "agua_diaria": dias_agua,
            "evolucao_peso": evolucao,
        }
