build-test:
	@docker build -t bigarelli/adhd-frontend .

publish-test:
	@docker push bigarelli/adhd-frontend