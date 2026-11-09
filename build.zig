const std = @import("std");

pub fn build(b: *std.Build) void {
    const prebuild = b.addSystemCommand(&.{
        "cmd.exe",
        "/c",
        "npx",
        "expo",
        "prebuild",
        "--platform",
        "android",
        "--no-install",
    });

    const assemble = b.addSystemCommand(&.{
        "cmd.exe",
        "/c",
        "gradlew.bat",
        ":app:assembleRelease",
        "-I",
        "..\\cmake-short-path.init.gradle",
        "-Pandroid.cmakeVersion=3.31.6",
    });
    assemble.setCwd(b.path("android"));
    const android_home = b.graph.environ_map.get("ANDROID_HOME") orelse
        b.graph.environ_map.get("ANDROID_SDK_ROOT") orelse blk: {
            const short_sdk = "C:\\AndroidSdk";
            if (std.Io.Dir.accessAbsolute(b.graph.io, short_sdk, .{})) |_| {
                break :blk short_sdk;
            } else |_| {}
            break :blk b.fmt("{s}\\Android\\Sdk", .{
                b.graph.environ_map.get("LOCALAPPDATA") orelse
                    @panic("LOCALAPPDATA is required to locate the Android SDK"),
            });
        };
    assemble.setEnvironmentVariable("ANDROID_HOME", android_home);
    assemble.setEnvironmentVariable("ANDROID_SDK_ROOT", android_home);
    assemble.setEnvironmentVariable("CMAKE_VERSION", "3.31.6");
    if (b.graph.environ_map.get("JAVA_HOME")) |java_home| {
        assemble.setEnvironmentVariable("JAVA_HOME", java_home);
    } else if (b.graph.environ_map.get("USERPROFILE")) |profile| {
        const gradle_jdk = b.fmt("{s}\\.gradle\\jdks\\eclipse_adoptium-17-amd64-windows.2", .{profile});
        if (std.Io.Dir.accessAbsolute(b.graph.io, gradle_jdk, .{})) |_| {
            assemble.setEnvironmentVariable("JAVA_HOME", gradle_jdk);
        } else |_| {}
    }
    assemble.step.dependOn(&prebuild.step);

    b.step("apk", "Build the Android release APK").dependOn(&assemble.step);
}
