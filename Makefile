.PHONY: up down logs clean migrate seed lint test build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f backend frontend

clean:
	docker-compose down -v
	rm -rf backend/dist frontend/.next

migrate:
	docker-compose exec backend npm run migration:run

seed:
	docker-compose exec backend npm run seed

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

test:
	cd backend && npm test
	cd frontend && npm test
