'use strict';

angular.module('avApp')
  .controller('ExempelMatrisCtrl', ['$scope',
      function ($scope) {

        $scope.apa = {};

        var _logicalAddresses = [
          {
            'hsaId':'SE2321000016-8LHV',
            'namn':'VE: SLL - Blodbussen vid Alkärrsplan Nynäshamn'
          },
          {
            'hsaId':'SE2321000016-2SG8',
            'namn':'VE: SLL - Klin för klin imm och transfus '
          },
          {
            'hsaId':'SE2321000016-8LHR',
            'namn':'VE: SLL - Blodbussen vid Tieto Sweden'
          },
          {
            'hsaId':'SE2321000016-8LHT',
            'namn':'VE: SLL - Blodbussen vid Södertörns Högskola'
          },
          {
            'hsaId':'SE2321000016-8LHW',
            'namn':'VE: SLL - Blodbussen vid Kista galleria'
          }
        ];

        for(var i = 0; i < 10; i += 1) {
          _logicalAddresses.push({
            'hsaId':'SE2321' + i + '000' + i + '6-8LHW',
            'namn':'VE: SLL - ... ' + i
          });
        }

        $scope.logicalAddresses = _.cloneDeep(_logicalAddresses);

        var contractData = [
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'CancelBooking',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:CancelBooking',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetAllCareTypes',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetAllCareTypes',
            'installedForProducerHsaId':false
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetAllHealthcareFacilities',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetAllHealthcareFacilities',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetAllPerformers',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetAllPerformers',
            'installedForProducerHsaId':false
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetAllTimeTypes',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetAllTimeTypes',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetAvailableDates',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetAvailableDates',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetAvailableTimeslots',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetAvailableTimeslots',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetBookingDetails',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetBookingDetails',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'GetSubjectOfCareSchedule',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:GetSubjectOfCareSchedule',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'MakeBooking',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:MakeBooking',
            'installedForProducerHsaId':true
          },
          {
            'installedInEnvironment':true,
            'class':'se.skltp.ap.services.dto.TjansteKontraktDTO',
            'minorVersion':1,
            'namn':'UpdateBooking',
            'majorVersion':1,
            'namnrymd':'crm:scheduling:UpdateBooking',
            'installedForProducerHsaId':true
          }
        ];

        $scope.contractData = _.map(contractData, function(contract) {
          contract.checkAll = false;
          return contract;
        });

        _.forEach($scope.logicalAddresses, function(logicalAddress) {
          $scope.apa[logicalAddress.hsaId] = {};
          _.forEach($scope.contractData, function(contract) {
            $scope.apa[logicalAddress.hsaId][contract.namn] = {};
            var disabled = Math.random()<0.33;
            $scope.apa[logicalAddress.hsaId][contract.namn].disabled = disabled;
            if (!disabled) {
              var installed = Math.random()<0.5;
              $scope.apa[logicalAddress.hsaId][contract.namn].installed = installed;
              $scope.apa[logicalAddress.hsaId][contract.namn].checked = installed;
            }
          });
        });

        $scope.selectAll = function(contract) {
          _.forOwn($scope.apa, function(val, key) {
            var disabled = $scope.apa[key][contract.namn].disabled;
            console.log($scope.apa[key][contract.namn]);
            $scope.apa[key][contract.namn].checked = !disabled && contract.checkAll;
          });
        };

        $scope.filterLogiskaAdresser = function(inputText) {
          if (inputText) {
            $scope.logicalAddresses = _.filter(_logicalAddresses, function(logicalAddress) {
              return logicalAddress.namn.toLowerCase().indexOf(inputText.toLowerCase()) > -1 ||
                logicalAddress.hsaId.toLowerCase().indexOf(inputText.toLowerCase()) > -1;
            });
          } else {
            console.log(_logicalAddresses);
            $scope.logicalAddresses = _.cloneDeep(_logicalAddresses);
          }
        };


      }
    ]
  );
