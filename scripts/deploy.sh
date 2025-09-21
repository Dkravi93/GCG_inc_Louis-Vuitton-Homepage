#!/bin/bash

# Production Deployment Script for Luxury E-commerce Platform
# This script handles the complete deployment process

set -e  # Exit immediately if a command exits with a non-zero status

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="luxury-ecommerce"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="/opt/backups/$PROJECT_NAME"
LOG_FILE="/var/log/$PROJECT_NAME/deploy.log"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_blue() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to check if required tools are installed
check_requirements() {
    print_blue "Checking deployment requirements..."
    
    local required_tools=("docker" "docker-compose" "git" "curl")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install missing tools and run again."
        exit 1
    fi
    
    print_status "All required tools are installed ✓"
}

# Function to backup current deployment
backup_current_deployment() {
    print_blue "Creating backup of current deployment..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p "$BACKUP_DIR"
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
    
    # Create backup directory
    sudo mkdir -p "$backup_path"
    
    # Backup database
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps mongodb | grep -q "Up"; then
        print_status "Backing up MongoDB database..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongodb mongodump --out /tmp/backup_$backup_timestamp
        docker cp $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q mongodb):/tmp/backup_$backup_timestamp "$backup_path/mongodb/"
    fi
    
    # Backup uploads
    if [ -d "./uploads" ]; then
        print_status "Backing up upload files..."
        sudo cp -r ./uploads "$backup_path/uploads"
    fi
    
    # Backup environment files
    if [ -f "./backend/.env.production" ]; then
        sudo cp ./backend/.env.production "$backup_path/"
    fi
    
    print_status "Backup completed: $backup_path"
    log_message "Backup created at $backup_path"
}

# Function to pull latest code
pull_latest_code() {
    print_blue "Pulling latest code from repository..."
    
    # Stash any local changes
    git stash push -m "Deployment stash $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Pull latest changes
    git pull origin main || git pull origin master
    
    print_status "Code updated successfully ✓"
    log_message "Code updated to latest version"
}

# Function to build and deploy
deploy_application() {
    print_blue "Building and deploying application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
    
    # Remove unused Docker resources
    print_status "Cleaning up Docker resources..."
    docker system prune -f
    
    # Build new images
    print_status "Building new Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    print_status "Application deployed successfully ✓"
    log_message "Application deployed successfully"
}

# Function to run health checks
health_check() {
    print_blue "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    
    # Wait for backend to be healthy
    print_status "Checking backend health..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:5000/health > /dev/null; then
            print_status "Backend is healthy ✓"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Backend health check failed after $max_attempts attempts"
            return 1
        fi
        
        print_status "Attempt $attempt/$max_attempts - Backend not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    # Check database connectivity
    print_status "Checking database connectivity..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongodb mongosh --eval "db.runCommand({ ping: 1 })" > /dev/null; then
        print_status "Database is healthy ✓"
    else
        print_error "Database health check failed"
        return 1
    fi
    
    # Check Redis connectivity
    print_status "Checking Redis connectivity..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null; then
        print_status "Redis is healthy ✓"
    else
        print_error "Redis health check failed"
        return 1
    fi
    
    print_status "All health checks passed ✓"
    log_message "All health checks passed"
}

# Function to update SSL certificates
update_ssl_certificates() {
    print_blue "Updating SSL certificates..."
    
    # Run certbot for certificate renewal
    if docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm certbot renew; then
        print_status "SSL certificates updated ✓"
        
        # Reload nginx to use new certificates
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec nginx nginx -s reload
        print_status "Nginx reloaded with new certificates ✓"
    else
        print_warning "SSL certificate update failed or not needed"
    fi
    
    log_message "SSL certificate update completed"
}

# Function to run database migrations (if any)
run_migrations() {
    print_blue "Running database migrations..."
    
    # Example migration command - adjust based on your migration setup
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend npm run migrate; then
        print_status "Database migrations completed ✓"
    else
        print_warning "No migrations to run or migrations failed"
    fi
    
    log_message "Database migrations completed"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_blue "Cleaning up old backups..."
    
    # Keep only last 7 backups
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -type d -name "backup_*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
        print_status "Old backups cleaned up ✓"
    fi
    
    log_message "Old backups cleanup completed"
}

# Function to send deployment notification
send_notification() {
    local status=$1
    local webhook_url="${SLACK_WEBHOOK_URL:-}"
    
    if [ -n "$webhook_url" ]; then
        local color="good"
        local message="✅ Deployment successful"
        
        if [ "$status" != "success" ]; then
            color="danger"
            message="❌ Deployment failed"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message for $PROJECT_NAME\",\"ts\":$(date +%s)}]}" \
            "$webhook_url" > /dev/null 2>&1 || true
    fi
}

# Function to show deployment status
show_status() {
    print_blue "Deployment Status:"
    echo
    
    print_status "Running containers:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo
    
    print_status "Service URLs:"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🚀 Backend API: http://localhost:5000"
    echo "  🗄️  MongoDB Admin: http://localhost:8081"
    echo "  🔴 Redis Admin: http://localhost:8082"
    echo "  📊 Grafana: http://localhost:3001"
    echo "  📈 Prometheus: http://localhost:9090"
    echo
    
    print_status "Logs can be viewed with:"
    echo "  docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service-name]"
}

# Function to rollback deployment
rollback() {
    print_error "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Find latest backup
    local latest_backup=$(find "$BACKUP_DIR" -type d -name "backup_*" | sort -r | head -n 1)
    
    if [ -n "$latest_backup" ]; then
        print_status "Rolling back to: $latest_backup"
        
        # Restore uploads
        if [ -d "$latest_backup/uploads" ]; then
            rm -rf ./uploads
            cp -r "$latest_backup/uploads" ./uploads
        fi
        
        # Restore database would require more complex logic
        print_warning "Database rollback needs to be done manually"
        
        # Start containers with previous configuration
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        
        print_status "Rollback completed ✓"
        log_message "Rollback completed to $latest_backup"
    else
        print_error "No backup found for rollback"
        exit 1
    fi
}

# Main deployment function
main() {
    print_blue "Starting deployment of $PROJECT_NAME..."
    log_message "Deployment started"
    
    # Create log directory
    sudo mkdir -p "$(dirname "$LOG_FILE")"
    
    # Parse command line arguments
    local command="${1:-deploy}"
    
    case $command in
        "deploy")
            check_requirements
            backup_current_deployment
            pull_latest_code
            deploy_application
            run_migrations
            health_check
            update_ssl_certificates
            cleanup_old_backups
            
            if [ $? -eq 0 ]; then
                print_status "🎉 Deployment completed successfully!"
                show_status
                send_notification "success"
                log_message "Deployment completed successfully"
            else
                print_error "💥 Deployment failed!"
                send_notification "failed"
                log_message "Deployment failed"
                exit 1
            fi
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 [deploy|rollback|status|health]"
            echo "  deploy   - Full deployment (default)"
            echo "  rollback - Rollback to previous version"
            echo "  status   - Show current deployment status"
            echo "  health   - Run health checks only"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"