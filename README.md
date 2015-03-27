**_Moved to https://github.com/skltp-incubator/anslutningsverktyg_**

anslutningsverktyg
==================

Frontend applikation för anslutningsverktyget

## Prerequisites
* Node.js
* Bower
* Grunt

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