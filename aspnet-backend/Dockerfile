# Build context is the repository root (fly.toml and render.yaml both build
# from here, so the GitHub Actions web deploy works without edits).

# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY aspnet-backend/aspnet-backend.csproj ./
RUN dotnet restore
COPY aspnet-backend/ ./
RUN dotnet publish aspnet-backend.csproj -c Release -o /app/publish --no-restore

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "aspnet-backend.dll"]
