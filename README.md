**_Moved to https://github.com/SLL-RTP/anslutningsverktyg_**

anslutningsverktyg
==================

Frontend applikation för anslutningsverktyget

## Prerequisites for development
* Node.js
* Bower
* Grunt
* Ruby
* Compass

Se respektive hemsida för installationsinstruktioner för ditt operativsystem

testat med Node.js v0.12.2, grunt-cli v0.1.13, grunt v0.4.5, bower 1.4.1, ruby 1.9.3p484, Compass 1.0.3

## Project setup
installera beroenden för att bygga projektet

    npm install

installera beroenden för applikationen

    bower install
    
bygga projektet för produktion (hamnar i dist-katalogen)

    grunt build
    
bygga projektet för development (hamnar i dist-katalogen)

    grunt build-development
    
starta lokal utvecklingsserver på port 9000

    grunt serve


## Config
Konfiguration för olika miljöer görs i

	./config/environments/{development, production}.json

Om en property läggs till i en sådan fil ska följande fil uppdateras:

	./config/config.js
	
enligt mönstret:

	apiHost: '@@apiHost'
	
När kommandot

	grunt replace:development
	
eller

	grunt replace:production
	
körs skapas en konfigurationsfil i katalogen:

	./app/scripts/services/config.js
	
Denna fil behöver inte checkas in eftersom den genereras om exempelvis vid byggen.

Konfiguration är åtkomlig via en konstant kallad *configuration*.
Således in din service kan du göra följande:
	...['configuration', function(configuration) {
		configuration.enProperty
	}
	...

## Maven

bygga projektet (war)

prod:

    mvn clean install

acc:

    mvn clean install -Pacceptance

development (incl amazon)

    mvn clean install -Pdevelopment

release (bygga, tagga, pusha, uppdatera version)

    mvn release:prepare
