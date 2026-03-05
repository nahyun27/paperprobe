from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, query, compare, graph, security
from db.sqlite import init_db

app = FastAPI(title="Paperprobe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(upload.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(security.router, prefix="/api")