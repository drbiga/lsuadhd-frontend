CONTAINER_NAME=lsuadhd-frontend

IMAGE_TEST=bigarelli/adhd-frontend:test
IMAGE_PROD=bigarelli/adhd-frontend:prod



build-test:
	@docker build -t ${IMAGE_TEST} .

publish-test:
	@docker push ${IMAGE_TEST}

run-test:
	@cp .env.frontend.test .env
	@docker run --rm --name ${CONTAINER_NAME} -d -p 5173:80 ${IMAGE_TEST}

build-prod:
	@docker build -t ${IMAGE_PROD} .

publish-prod:
	@docker push ${IMAGE_PROD}

run-prod:
	@cp .env.frontend.prod .env
	@docker run --rm --name ${CONTAINER_NAME} -d -p 5173:80 ${IMAGE_PROD}

stop:
	@docker stop ${CONTAINER_NAME}

clean:
	@docker rm ${CONTAINER_NAME}
