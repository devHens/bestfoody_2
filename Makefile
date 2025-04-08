start-container: 
	@echo "Starting the container..."
	docker compose up -d --build
	@echo "Container started."

down-app:
	@echo "Stopping the application..."
	docker compose down
	@echo "Application stopped."

seed:
	@echo "Seeding data to MongoDB..."
	docker exec -it bestfoody_service bash -c "node /usr/src/app/seed.js"
	@echo "Seeding completed."

start-app: start-container seed

.PHONY: seed start-app down-app
