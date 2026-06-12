from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

class FootballAppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)

class AuthException(FootballAppException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=401, detail=detail)

class ForbiddenException(FootballAppException):
    def __init__(self, detail: str = "Access forbidden"):
        super().__init__(status_code=403, detail=detail)

class NotFoundException(FootballAppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)

class BadRequestException(FootballAppException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=400, detail=detail)

class ConflictException(FootballAppException):
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(status_code=409, detail=detail)

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(FootballAppException)
    async def football_app_exception_handler(request: Request, exc: FootballAppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
