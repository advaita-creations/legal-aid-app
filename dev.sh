#!/bin/bash

# Legal Aid App - Development Service Manager
# Usage: ./dev.sh [start|stop|status|restart|logs]

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PID_FILE="/tmp/legal-aid-backend.pid"
FRONTEND_PID_FILE="/tmp/legal-aid-frontend.pid"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_backend_status() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "running"
            return 0
        fi
    fi
    echo "stopped"
    return 1
}

check_frontend_status() {
    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "running"
            return 0
        fi
    fi
    echo "stopped"
    return 1
}

start_backend() {
    if [ "$(check_backend_status)" = "running" ]; then
        print_warning "Backend already running (PID: $(cat $BACKEND_PID_FILE))"
        return 0
    fi

    print_status "Starting Django backend..."
    cd "$BACKEND_DIR"
    
    # Activate virtual environment and start server
    source venv/bin/activate
    nohup python manage.py runserver > /tmp/legal-aid-backend.log 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    
    sleep 2
    if [ "$(check_backend_status)" = "running" ]; then
        print_success "Backend started on http://127.0.0.1:8000 (PID: $(cat $BACKEND_PID_FILE))"
    else
        print_error "Backend failed to start. Check /tmp/legal-aid-backend.log"
        return 1
    fi
}

start_frontend() {
    if [ "$(check_frontend_status)" = "running" ]; then
        print_warning "Frontend already running (PID: $(cat $FRONTEND_PID_FILE))"
        return 0
    fi

    print_status "Starting Vite frontend..."
    cd "$FRONTEND_DIR"
    
    nohup npm run dev > /tmp/legal-aid-frontend.log 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    
    sleep 2
    if [ "$(check_frontend_status)" = "running" ]; then
        print_success "Frontend started on http://localhost:5173 (PID: $(cat $FRONTEND_PID_FILE))"
    else
        print_error "Frontend failed to start. Check /tmp/legal-aid-frontend.log"
        return 1
    fi
}

stop_backend() {
    if [ "$(check_backend_status)" = "stopped" ]; then
        print_warning "Backend not running"
        return 0
    fi

    print_status "Stopping Django backend..."
    PID=$(cat "$BACKEND_PID_FILE")
    kill "$PID" 2>/dev/null || true
    rm -f "$BACKEND_PID_FILE"
    print_success "Backend stopped"
}

stop_frontend() {
    if [ "$(check_frontend_status)" = "stopped" ]; then
        print_warning "Frontend not running"
        return 0
    fi

    print_status "Stopping Vite frontend..."
    PID=$(cat "$FRONTEND_PID_FILE")
    kill "$PID" 2>/dev/null || true
    rm -f "$FRONTEND_PID_FILE"
    print_success "Frontend stopped"
}

show_status() {
    echo ""
    echo "=== Legal Aid App - Service Status ==="
    echo ""
    
    BACKEND_STATUS=$(check_backend_status)
    FRONTEND_STATUS=$(check_frontend_status)
    
    if [ "$BACKEND_STATUS" = "running" ]; then
        print_success "Backend:  Running (PID: $(cat $BACKEND_PID_FILE)) - http://127.0.0.1:8000"
    else
        print_error "Backend:  Stopped"
    fi
    
    if [ "$FRONTEND_STATUS" = "running" ]; then
        print_success "Frontend: Running (PID: $(cat $FRONTEND_PID_FILE)) - http://localhost:5173"
    else
        print_error "Frontend: Stopped"
    fi
    
    echo ""
    echo "Database: SQLite (backend/db.sqlite3)"
    if [ -f "$BACKEND_DIR/db.sqlite3" ]; then
        DB_SIZE=$(du -h "$BACKEND_DIR/db.sqlite3" | cut -f1)
        print_success "Database: $DB_SIZE"
    else
        print_warning "Database: Not initialized (run migrations)"
    fi
    echo ""
}

show_logs() {
    SERVICE=$1
    case $SERVICE in
        backend)
            if [ -f /tmp/legal-aid-backend.log ]; then
                tail -f /tmp/legal-aid-backend.log
            else
                print_error "No backend logs found"
            fi
            ;;
        frontend)
            if [ -f /tmp/legal-aid-frontend.log ]; then
                tail -f /tmp/legal-aid-frontend.log
            else
                print_error "No frontend logs found"
            fi
            ;;
        *)
            print_error "Usage: $0 logs [backend|frontend]"
            exit 1
            ;;
    esac
}

case "${1:-}" in
    start)
        echo ""
        echo "=== Starting Legal Aid App ==="
        echo ""
        start_backend
        start_frontend
        echo ""
        show_status
        ;;
    stop)
        echo ""
        echo "=== Stopping Legal Aid App ==="
        echo ""
        stop_backend
        stop_frontend
        echo ""
        print_success "All services stopped"
        echo ""
        ;;
    restart)
        echo ""
        echo "=== Restarting Legal Aid App ==="
        echo ""
        stop_backend
        stop_frontend
        sleep 1
        start_backend
        start_frontend
        echo ""
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-backend}"
        ;;
    *)
        echo "Legal Aid App - Development Service Manager"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start    - Start backend and frontend servers"
        echo "  stop     - Stop all running servers"
        echo "  restart  - Restart all servers"
        echo "  status   - Show service status"
        echo "  logs     - Show logs (backend|frontend)"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 status"
        echo "  $0 logs backend"
        echo "  $0 stop"
        echo ""
        exit 1
        ;;
esac
