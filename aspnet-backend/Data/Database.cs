using Npgsql;

namespace VscmsErp.Api.Data;

/// <summary>
/// Postgres connection management (hosted on Neon in production).
/// The DATABASE_URL env var carries the full connection string; Npgsql
/// accepts both postgresql:// URIs and key=value connection strings.
/// </summary>
public static class Database
{
    public static readonly string ConnectionString = ResolveConnectionString();

    private static string ResolveConnectionString()
    {
        var url = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(url)) return NormalizeConnectionString(url);
        throw new InvalidOperationException(
            "DATABASE_URL environment variable is required (e.g. a Neon Postgres connection string).");
    }

    /// <summary>
    /// Npgsql's connection-string builder only accepts key=value pairs, not
    /// postgresql:// URIs. Convert a Neon-style URL into a key=value string
    /// so DATABASE_URL can be pasted as-is from the provider dashboard.
    /// </summary>
    private static string NormalizeConnectionString(string url)
    {
        if (!url.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !url.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return url; // already key=value form

        var uri = new Uri(url);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port == -1 ? 5432 : uri.Port,
            Database = uri.AbsolutePath.TrimStart('/'),
        };
        var userInfo = uri.UserInfo;
        if (userInfo.Length > 0)
        {
            var colon = userInfo.IndexOf(':');
            builder.Username = Uri.UnescapeDataString(colon < 0 ? userInfo : userInfo[..colon]);
            if (colon >= 0)
                builder.Password = Uri.UnescapeDataString(userInfo[(colon + 1)..]);
        }
        if (uri.Query.Contains("sslmode=require", StringComparison.OrdinalIgnoreCase))
            builder.SslMode = SslMode.Require;
        else if (uri.Query.Contains("sslmode=disable", StringComparison.OrdinalIgnoreCase))
            builder.SslMode = SslMode.Disable;
        return builder.ConnectionString;
    }

    public static NpgsqlConnection Open()
    {
        var conn = new NpgsqlConnection(ConnectionString);
        conn.Open();
        return conn;
    }

    public static void Exec(NpgsqlConnection conn, string sql, params (string Name, object? Value)[] parameters)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        foreach (var (name, value) in parameters)
            cmd.Parameters.AddWithValue(name, value ?? DBNull.Value);
        cmd.ExecuteNonQuery();
    }

    /// <summary>Executes a statement and returns the number of affected rows.</summary>
    public static int ExecWithCount(NpgsqlConnection conn, string sql, params (string Name, object? Value)[] parameters)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        foreach (var (name, value) in parameters)
            cmd.Parameters.AddWithValue(name, value ?? DBNull.Value);
        return cmd.ExecuteNonQuery();
    }

    /// <summary>Runs the idempotent schema statements so a fresh database works immediately.</summary>
    public static void EnsureDatabase()
    {
        using var conn = Open();
        foreach (var ddl in Schema.DDL)
            Exec(conn, ddl);
    }
}
