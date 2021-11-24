dc = docker-compose up --remove-orphans

clean:
	rm -rf bin obj

clean-db:
	rm -rf .data

restore:
	COMMAND=restore $(dc)

run:
	COMMAND=run $(dc)

.PHONY: clean clean-db restore build
