using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

public static class CompetitionEndpoints
{
    public static IEndpointRouteBuilder MapCompetitionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListCompetitions);
        app.MapPost("/", CreateCompetition);
        app.MapPut("/{id:long}", UpdateCompetition);
        app.MapDelete("/{id:long}", DeleteCompetition);
        
        app.MapGet("/{id:long}/teams", ListTeams);
        app.MapPost("/{id:long}/teams", CreateTeam);
        app.MapPost("/teams/{teamId:long}/respond", RespondTeamInvite);
        app.MapPost("/teams/{teamId:long}/lock", LockTeam);

        app.MapGet("/{id:long}/submissions", ListSubmissions);
        app.MapPost("/{id:long}/submit", SubmitProject);

        app.MapPost("/{id:long}/evaluate", EvaluateSubmission);
        app.MapGet("/{id:long}/leaderboard", GetLeaderboard);
        app.MapPost("/{id:long}/checkin", CheckInAttendance);
        app.MapPost("/{id:long}/finalize", FinalizeWinners);
        app.MapGet("/certificates/{certCode}", GetCertificate);
        app.MapGet("/achievements/{userId:long}", GetUserAchievements);

        return app;
    }

    private static IResult ListCompetitions()
    {
        Database.EnsureDatabase();
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM competitions ORDER BY id DESC";
        using var reader = cmd.ExecuteReader();
        var list = new List<CompetitionDto>();
        while (reader.Read()) list.Add(CompetitionDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult CreateCompetition(HttpContext ctx, CreateCompetitionRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || (user.Role != "admin" && user.Role != "faculty"))
            return Results.Json(new { error = "Only faculty and admin can create competitions" }, statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.CompDate))
            return Results.Json(new { error = "Title and Competition Date are required" }, statusCode: 400);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO competitions (
                title, description, type, reg_start, reg_end, comp_date,
                team_size_min, team_size_max, eligibility_dept, rules,
                problem_statements, submission_deadline, evaluation_criteria, prizes, status
            ) VALUES (
                @title, @description, @type, @reg_start, @reg_end, @comp_date,
                @team_size_min, @team_size_max, @eligibility_dept, @rules,
                @problem_statements, @submission_deadline, @evaluation_criteria, @prizes, 'open'
            ) RETURNING id;";
        cmd.Parameters.AddWithValue("@title", body.Title.Trim());
        cmd.Parameters.AddWithValue("@description", body.Description ?? "");
        cmd.Parameters.AddWithValue("@type", string.IsNullOrWhiteSpace(body.Type) ? "Hackathon" : body.Type);
        cmd.Parameters.AddWithValue("@reg_start", string.IsNullOrWhiteSpace(body.RegStart) ? DateTime.Now.ToString("yyyy-MM-dd") : body.RegStart);
        cmd.Parameters.AddWithValue("@reg_end", string.IsNullOrWhiteSpace(body.RegEnd) ? DateTime.Now.AddDays(7).ToString("yyyy-MM-dd") : body.RegEnd);
        cmd.Parameters.AddWithValue("@comp_date", body.CompDate);
        cmd.Parameters.AddWithValue("@team_size_min", body.TeamSizeMin <= 0 ? 1 : body.TeamSizeMin);
        cmd.Parameters.AddWithValue("@team_size_max", body.TeamSizeMax <= 0 ? 4 : body.TeamSizeMax);
        cmd.Parameters.AddWithValue("@eligibility_dept", string.IsNullOrWhiteSpace(body.EligibilityDept) ? "All Departments" : body.EligibilityDept);
        cmd.Parameters.AddWithValue("@rules", body.Rules ?? "Follow code of conduct and build original solutions.");
        cmd.Parameters.AddWithValue("@problem_statements", body.ProblemStatements ?? "Solve real-world challenges.");
        cmd.Parameters.AddWithValue("@submission_deadline", string.IsNullOrWhiteSpace(body.SubmissionDeadline) ? body.CompDate : body.SubmissionDeadline);
        cmd.Parameters.AddWithValue("@evaluation_criteria", body.EvaluationCriteria ?? "Innovation (20), Tech (20), UI/UX (20), Impact (20), Presentation (20)");
        cmd.Parameters.AddWithValue("@prizes", body.Prizes ?? "1st: ?50,000 | 2nd: ?30,000 | 3rd: ?15,000");

        var newId = Convert.ToInt64(cmd.ExecuteScalar());
        return Results.Json(new { id = newId, message = "Competition created successfully" });
    }

    private static IResult UpdateCompetition(long id, UpdateCompetitionRequest body)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE competitions SET
                is_leaderboard_published = COALESCE(@is_leaderboard_published, is_leaderboard_published),
                status = COALESCE(@status, status),
                problem_statements = COALESCE(@problem_statements, problem_statements)
            WHERE id = @id;";
        cmd.Parameters.AddWithValue("@id", id);
        cmd.Parameters.AddWithValue("@is_leaderboard_published", body.IsLeaderboardPublished.HasValue ? (object)body.IsLeaderboardPublished.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@status", string.IsNullOrWhiteSpace(body.Status) ? DBNull.Value : (object)body.Status);
        cmd.Parameters.AddWithValue("@problem_statements", string.IsNullOrWhiteSpace(body.ProblemStatements) ? DBNull.Value : (object)body.ProblemStatements);
        cmd.ExecuteNonQuery();

        return Results.Json(new { message = "Competition updated" });
    }

    private static IResult DeleteCompetition(long id)
    {
        using var conn = Database.Open();
        Database.Exec(conn, "DELETE FROM competitions WHERE id = @id", ("id", id));
        return Results.Json(new { message = "Competition deleted" });
    }

    private static IResult ListTeams(long id)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM competition_teams WHERE competition_id = @comp_id ORDER BY id DESC";
        cmd.Parameters.AddWithValue("@comp_id", id);
        using var r = cmd.ExecuteReader();
        var teams = new List<CompetitionTeamDto>();
        while (r.Read()) teams.Add(CompetitionTeamDto.Map(r));
        r.Close();

        foreach (var team in teams)
        {
            using var mCmd = conn.CreateCommand();
            mCmd.CommandText = "SELECT * FROM competition_team_members WHERE team_id = @team_id";
            mCmd.Parameters.AddWithValue("@team_id", team.Id);
            using var mReader = mCmd.ExecuteReader();
            while (mReader.Read()) team.Members.Add(CompetitionTeamMemberDto.Map(mReader));
        }

        return Results.Json(teams);
    }

    private static IResult CreateTeam(long id, HttpContext ctx, CreateTeamRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Unauthorized" }, statusCode: 401);

        if (string.IsNullOrWhiteSpace(body.TeamName))
            return Results.Json(new { error = "Team name is required" }, statusCode: 400);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO competition_teams (competition_id, team_name, captain_id, captain_name, is_locked)
            VALUES (@comp_id, @team_name, @captain_id, @captain_name, 0) RETURNING id;";
        cmd.Parameters.AddWithValue("@comp_id", id);
        cmd.Parameters.AddWithValue("@team_name", body.TeamName.Trim());
        cmd.Parameters.AddWithValue("@captain_id", user.Id);
        cmd.Parameters.AddWithValue("@captain_name", user.Name);
        var teamId = Convert.ToInt64(cmd.ExecuteScalar());

        Database.Exec(conn, @"
            INSERT INTO competition_team_members (team_id, user_id, user_name, email, role_in_team, status)
            VALUES (@team_id, @user_id, @user_name, @email, 'captain', 'accepted')",
            ("team_id", teamId), ("user_id", user.Id), ("user_name", user.Name), ("email", user.Email));

        if (body.MemberIds != null)
        {
            foreach (var memId in body.MemberIds)
            {
                if (memId == user.Id) continue;
                using var uCmd = conn.CreateCommand();
                uCmd.CommandText = "SELECT name, email FROM users WHERE id = @uid";
                uCmd.Parameters.AddWithValue("@uid", memId);
                using var uR = uCmd.ExecuteReader();
                if (uR.Read())
                {
                    var mName = uR.GetString(0);
                    var mEmail = uR.GetString(1);
                    uR.Close();
                    Database.Exec(conn, @"
                        INSERT INTO competition_team_members (team_id, user_id, user_name, email, role_in_team, status)
                        VALUES (@team_id, @user_id, @user_name, @email, 'member', 'invited')",
                        ("team_id", teamId), ("user_id", memId), ("user_name", mName), ("email", mEmail));
                }
            }
        }

        return Results.Json(new { id = teamId, message = "Team created & invites sent" });
    }

    private static IResult RespondTeamInvite(long teamId, HttpContext ctx, RespondInviteRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Unauthorized" }, statusCode: 401);

        var status = body.Accept ? "accepted" : "declined";
        using var conn = Database.Open();
        Database.Exec(conn, @"
            UPDATE competition_team_members SET status = @status
            WHERE team_id = @team_id AND user_id = @user_id",
            ("status", status), ("team_id", teamId), ("user_id", user.Id));

        return Results.Json(new { message = $"Invite {status}" });
    }

    private static IResult LockTeam(long teamId, HttpContext ctx)
    {
        using var conn = Database.Open();
        Database.Exec(conn, "UPDATE competition_teams SET is_locked = 1 WHERE id = @id", ("id", teamId));
        return Results.Json(new { message = "Team registration locked" });
    }

    private static IResult ListSubmissions(long id)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM competition_submissions WHERE competition_id = @comp_id ORDER BY id DESC";
        cmd.Parameters.AddWithValue("@comp_id", id);
        using var r = cmd.ExecuteReader();
        var list = new List<CompetitionSubmissionDto>();
        while (r.Read()) list.Add(CompetitionSubmissionDto.Map(r));
        return Results.Json(list);
    }

    private static IResult SubmitProject(long id, HttpContext ctx, SubmitProjectRequest body)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO competition_submissions (
                competition_id, team_id, team_name, project_title, description,
                github_url, demo_url, ppt_url, screenshots_url, video_url, is_locked
            ) VALUES (
                @comp_id, @team_id, @team_name, @project_title, @description,
                @github_url, @demo_url, @ppt_url, @screenshots_url, @video_url, 1
            ) RETURNING id;";
        cmd.Parameters.AddWithValue("@comp_id", id);
        cmd.Parameters.AddWithValue("@team_id", body.TeamId);
        cmd.Parameters.AddWithValue("@team_name", body.TeamName ?? "Team");
        cmd.Parameters.AddWithValue("@project_title", body.ProjectTitle);
        cmd.Parameters.AddWithValue("@description", body.Description ?? "");
        cmd.Parameters.AddWithValue("@github_url", body.GithubUrl ?? "");
        cmd.Parameters.AddWithValue("@demo_url", body.DemoUrl ?? "");
        cmd.Parameters.AddWithValue("@ppt_url", body.PptUrl ?? "");
        cmd.Parameters.AddWithValue("@screenshots_url", body.ScreenshotsUrl ?? "");
        cmd.Parameters.AddWithValue("@video_url", body.VideoUrl ?? "");

        var subId = Convert.ToInt64(cmd.ExecuteScalar());
        return Results.Json(new { id = subId, message = "Project submitted & locked successfully" });
    }

    private static IResult EvaluateSubmission(long id, HttpContext ctx, EvaluateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        var judgeName = user?.Name ?? "Judge Panel";
        var judgeId = user?.Id ?? 1;

        double total = body.ScoreInnovation + body.ScoreTech + body.ScoreUiUx + body.ScoreImpact + body.ScorePresentation;

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO competition_evaluations (
                competition_id, team_id, judge_id, judge_name,
                score_innovation, score_tech, score_uiux, score_impact, score_presentation, total_score, remarks
            ) VALUES (
                @comp_id, @team_id, @judge_id, @judge_name,
                @score_inn, @score_tech, @score_uiux, @score_imp, @score_pres, @total, @remarks
            ) RETURNING id;";
        cmd.Parameters.AddWithValue("@comp_id", id);
        cmd.Parameters.AddWithValue("@team_id", body.TeamId);
        cmd.Parameters.AddWithValue("@judge_id", judgeId);
        cmd.Parameters.AddWithValue("@judge_name", judgeName);
        cmd.Parameters.AddWithValue("@score_inn", body.ScoreInnovation);
        cmd.Parameters.AddWithValue("@score_tech", body.ScoreTech);
        cmd.Parameters.AddWithValue("@score_uiux", body.ScoreUiUx);
        cmd.Parameters.AddWithValue("@score_imp", body.ScoreImpact);
        cmd.Parameters.AddWithValue("@score_pres", body.ScorePresentation);
        cmd.Parameters.AddWithValue("@total", total);
        cmd.Parameters.AddWithValue("@remarks", body.Remarks ?? "Good effort!");

        var evalId = Convert.ToInt64(cmd.ExecuteScalar());
        return Results.Json(new { id = evalId, totalScore = total, message = "Evaluation saved" });
    }

    private static IResult GetLeaderboard(long id)
    {
        using var conn = Database.Open();
        using var compCmd = conn.CreateCommand();
        compCmd.CommandText = "SELECT is_leaderboard_published FROM competitions WHERE id = @id";
        compCmd.Parameters.AddWithValue("@id", id);
        var pubObj = compCmd.ExecuteScalar();
        bool isPublished = pubObj != null && Convert.ToInt64(pubObj) == 1;

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT e.team_id, t.team_name, s.project_title,
                   AVG(e.total_score) as avg_score,
                   COUNT(e.id) as judge_count
            FROM competition_evaluations e
            JOIN competition_teams t ON e.team_id = t.id
            LEFT JOIN competition_submissions s ON s.team_id = t.id
            WHERE e.competition_id = @comp_id
            GROUP BY e.team_id, t.team_name, s.project_title
            ORDER BY avg_score DESC;";
        cmd.Parameters.AddWithValue("@comp_id", id);

        using var r = cmd.ExecuteReader();
        var leaderboard = new List<object>();
        int rank = 1;
        while (r.Read())
        {
            leaderboard.Add(new
            {
                rank = rank++,
                teamId = r.GetInt64(0),
                teamName = r.GetString(1),
                projectTitle = r.IsDBNull(2) ? "Project" : r.GetString(2),
                score = Math.Round(r.GetDouble(3), 1),
                judgeCount = r.GetInt64(4)
            });
        }

        return Results.Json(new { isPublished, leaderboard });
    }

    private static IResult CheckInAttendance(long id, HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Unauthorized" }, statusCode: 401);

        using var conn = Database.Open();
        Database.Exec(conn, @"
            INSERT INTO competition_attendance (competition_id, user_id, user_name, check_in_time, status)
            VALUES (@comp_id, @user_id, @user_name, @time, 'checked_in')",
            ("comp_id", id), ("user_id", user.Id), ("user_name", user.Name), ("time", DateTime.Now.ToString("yyyy-MM-DD HH:mm:ss")));

        return Results.Json(new { message = "Verified attendance check-in complete" });
    }

    private static IResult FinalizeWinners(long id, HttpContext ctx)
    {
        using var conn = Database.Open();
        Database.Exec(conn, "UPDATE competitions SET status = 'completed', is_leaderboard_published = 1 WHERE id = @id", ("id", id));

        // Get Competition Title
        using var titleCmd = conn.CreateCommand();
        titleCmd.CommandText = "SELECT title FROM competitions WHERE id = @id";
        titleCmd.Parameters.AddWithValue("@id", id);
        var titleObj = titleCmd.ExecuteScalar();
        string compTitle = titleObj?.ToString() ?? "VSCMS Competition";

        // Query ranked teams by avg evaluation score
        using var rankCmd = conn.CreateCommand();
        rankCmd.CommandText = @"
            SELECT e.team_id, t.team_name, AVG(e.total_score) as avg_score
            FROM competition_evaluations e
            JOIN competition_teams t ON e.team_id = t.id
            WHERE e.competition_id = @comp_id
            GROUP BY e.team_id, t.team_name
            ORDER BY avg_score DESC;";
        rankCmd.Parameters.AddWithValue("@comp_id", id);

        using var r = rankCmd.ExecuteReader();
        var rankedTeams = new List<(long teamId, string teamName, int rank)>();
        int currentRank = 1;
        while (r.Read())
        {
            rankedTeams.Add((r.GetInt64(0), r.GetString(1), currentRank++));
        }
        r.Close();

        // For each team, fetch members and generate certificates
        foreach (var (teamId, teamName, rank) in rankedTeams)
        {
            string certType = rank switch
            {
                1 => "winner_1st",
                2 => "winner_2nd",
                3 => "winner_3rd",
                <= 10 => "finalist",
                _ => "participant"
            };

            using var memCmd = conn.CreateCommand();
            memCmd.CommandText = "SELECT user_id, user_name FROM competition_team_members WHERE team_id = @team_id AND status = 'accepted'";
            memCmd.Parameters.AddWithValue("@team_id", teamId);
            using var mR = memCmd.ExecuteReader();
            var members = new List<(long userId, string userName)>();
            while (mR.Read()) members.Add((mR.GetInt64(0), mR.GetString(1)));
            mR.Close();

            foreach (var (uId, uName) in members)
            {
                string certCode = $"VSCMS-CERT-2026-COMP{id}-U{uId}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
                string rankLabel = certType == "winner_1st" ? "1st Place Winner" : certType == "winner_2nd" ? "2nd Place Winner" : certType == "winner_3rd" ? "3rd Place Winner" : certType == "finalist" ? "Top 10 Finalist" : "Participant";
                string qrPayload = $"VERIFIED: {rankLabel} - {compTitle} - {uName} ({teamName}) | Cert: {certCode}";

                using var certCmd = conn.CreateCommand();
                certCmd.CommandText = @"
                    INSERT INTO competition_certificates (
                        competition_id, competition_title, user_id, user_name, team_name, cert_type, cert_code, qr_payload
                    ) VALUES (
                        @comp_id, @comp_title, @user_id, @user_name, @team_name, @cert_type, @cert_code, @qr_payload
                    ) ON CONFLICT (cert_code) DO NOTHING;";
                certCmd.Parameters.AddWithValue("@comp_id", id);
                certCmd.Parameters.AddWithValue("@comp_title", compTitle);
                certCmd.Parameters.AddWithValue("@user_id", uId);
                certCmd.Parameters.AddWithValue("@user_name", uName);
                certCmd.Parameters.AddWithValue("@team_name", teamName);
                certCmd.Parameters.AddWithValue("@cert_type", certType);
                certCmd.Parameters.AddWithValue("@cert_code", certCode);
                certCmd.Parameters.AddWithValue("@qr_payload", qrPayload);
                certCmd.ExecuteNonQuery();
            }
        }

        return Results.Json(new { message = "Winners declared & digital certificates generated automatically" });
    }

    private static IResult GetCertificate(string certCode)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM competition_certificates WHERE cert_code = @code";
        cmd.Parameters.AddWithValue("@code", certCode);
        using var r = cmd.ExecuteReader();
        if (r.Read()) return Results.Json(CompetitionCertificateDto.Map(r));
        return Results.Json(new { error = "Certificate not found" }, statusCode: 404);
    }

    private static IResult GetUserAchievements(long userId)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM competition_certificates WHERE user_id = @user_id ORDER BY id DESC";
        cmd.Parameters.AddWithValue("@user_id", userId);
        using var r = cmd.ExecuteReader();
        var list = new List<CompetitionCertificateDto>();
        while (r.Read()) list.Add(CompetitionCertificateDto.Map(r));
        return Results.Json(list);
    }
}

public record CreateCompetitionRequest(
    string Title, string Description, string Type, string RegStart, string RegEnd,
    string CompDate, long TeamSizeMin, long TeamSizeMax, string EligibilityDept,
    string Rules, string ProblemStatements, string SubmissionDeadline,
    string EvaluationCriteria, string Prizes
);

public record UpdateCompetitionRequest(long? IsLeaderboardPublished, string? Status, string? ProblemStatements);
public record CreateTeamRequest(string TeamName, List<long>? MemberIds);
public record RespondInviteRequest(bool Accept);
public record SubmitProjectRequest(long TeamId, string TeamName, string ProjectTitle, string Description, string? GithubUrl, string? DemoUrl, string? PptUrl, string? ScreenshotsUrl, string? VideoUrl);
public record EvaluateRequest(long TeamId, long ScoreInnovation, long ScoreTech, long ScoreUiUx, long ScoreImpact, long ScorePresentation, string? Remarks);
