using MySqlConnector;

namespace VscmsErp.Api.Data;

/// <summary>
/// MySQL / TiDB Cloud connection management.
/// Accepts both mysql:// URIs and standard key=value MySQL connection strings.
/// </summary>
public static class Database
{
    public static readonly string ConnectionString = ResolveConnectionString();

    private static string ResolveConnectionString()
    {
        var url = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrWhiteSpace(url) || url.StartsWith("postgres", StringComparison.OrdinalIgnoreCase))
        {
            url = LoadUrlFromEnvFile() ?? url;
        }

        if (string.IsNullOrWhiteSpace(url) || url.StartsWith("postgres", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "DATABASE_URL is required in environment variables or .env file (e.g. mysql://user:pass@host:port/dbname).");
        }

        return NormalizeConnectionString(url);
    }

    private static string? LoadUrlFromEnvFile()
    {
        try
        {
            var paths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, ".env"),
                Path.Combine(Directory.GetCurrentDirectory(), ".env"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", ".env")
            };

            foreach (var path in paths)
            {
                if (File.Exists(path))
                {
                    foreach (var line in File.ReadAllLines(path))
                    {
                        var trimmed = line.Trim();
                        if (trimmed.StartsWith("DATABASE_URL=", StringComparison.OrdinalIgnoreCase))
                        {
                            var val = trimmed["DATABASE_URL=".Length..].Trim().Trim('"', '\'');
                            if (!string.IsNullOrWhiteSpace(val)) return val;
                        }
                    }
                }
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Converts a mysql:// URI into a MySqlConnectionStringBuilder connection string.
    /// </summary>
    private static string NormalizeConnectionString(string url)
    {
        if (!url.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase)
            && !url.StartsWith("mariadb://", StringComparison.OrdinalIgnoreCase))
            return url;

        var uri = new Uri(url);
        var dbName = uri.AbsolutePath.TrimStart('/');
        if (string.IsNullOrWhiteSpace(dbName) || string.Equals(dbName, "sys", StringComparison.OrdinalIgnoreCase))
        {
            dbName = "test";
        }

        var builder = new MySqlConnectionStringBuilder
        {
            Server = uri.Host,
            Port = uri.Port == -1 ? (uint)3306 : (uint)uri.Port,
            Database = dbName,
            SslMode = MySqlSslMode.Required,
            AllowPublicKeyRetrieval = true,
        };
        var userInfo = uri.UserInfo;
        if (userInfo.Length > 0)
        {
            var colon = userInfo.IndexOf(':');
            builder.UserID = Uri.UnescapeDataString(colon < 0 ? userInfo : userInfo[..colon]);
            if (colon >= 0)
                builder.Password = Uri.UnescapeDataString(userInfo[(colon + 1)..]);
        }
        return builder.ConnectionString;
    }

    public static MySqlConnection Open()
    {
        var conn = new MySqlConnection(ConnectionString);
        conn.Open();
        return conn;
    }

    public static void Exec(MySqlConnection conn, string sql, params (string Name, object? Value)[] parameters)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        foreach (var (name, value) in parameters)
            cmd.Parameters.AddWithValue(name, value ?? DBNull.Value);
        cmd.ExecuteNonQuery();
    }

    /// <summary>Executes a statement and returns the number of affected rows.</summary>
    public static int ExecWithCount(MySqlConnection conn, string sql, params (string Name, object? Value)[] parameters)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        foreach (var (name, value) in parameters)
            cmd.Parameters.AddWithValue(name, value ?? DBNull.Value);
        return cmd.ExecuteNonQuery();
    }

    private static bool _ensured = false;
    private static readonly object _ensuredLock = new();

    /// <summary>Runs the idempotent schema statements once so a fresh database works immediately.</summary>
    public static void EnsureDatabase()
    {
        if (_ensured) return;
        lock (_ensuredLock)
        {
            if (_ensured) return;
            using var conn = Open();
            foreach (var ddl in Schema.DDL)
                Exec(conn, ddl);
            _ensured = true;
        }
    }
}
