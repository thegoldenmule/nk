includes = -f ./docker-compose.yml
dc = docker-compose $(includes) up

clean:
	rm -rf nk-js/node_modules
	rm -rf nk-server/bin nk-server/obj

clean-db:
	rm -rf .data

restore:
	NK_COMMAND=restore NKWEB_COMMAND=restore $(dc) --no-deps nk-web nk

run:
	NK_COMMAND="watch run" NKWEB_COMMAND=start $(dc) --remove-orphans --force-recreate

.PHONY: clean clean-db restore run