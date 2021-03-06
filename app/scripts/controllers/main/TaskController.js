(function (module) {
    mifosX.controllers = _.extend(module, {
        TaskController: function (scope, resourceFactory, route, dateFilter, $modal, location,$scope,$timeout) {
            scope.clients = [];
            scope.loans = [];
            scope.offices = [];
            var idToNodeMap = {};
            scope.formData = {};
            scope.loanTemplate = {};
            scope.loanDisbursalTemplate = {};
            scope.date = {};
            scope.checkData = [];
            scope.isCollapsed = true;
            scope.approveData = {};
            scope.restrictDate = new Date();
            //this value will be changed within each specific tab
            scope.centersPerPage = 15;
            scope.centers = [];
            scope.actualCenters = [];
            scope.searchText = "";
            scope.searchResults = [];
            scope.requestIdentifier = "loanId";
            scope.groups = [];
            scope.loanOfficers=[];
            scope.staffs =[];
            scope.formData1={};

            resourceFactory.checkerInboxResource.get({templateResource: 'searchtemplate'}, function (data) {
                scope.checkerTemplate = data;
            });
            resourceFactory.checkerInboxResource.search(function (data) {
                scope.searchData = data;
            });
            /* for displaying centers*/
            var requestParams = {staffInSelectedOfficeOnly:true};
            resourceFactory.clientTemplateResource.get(requestParams, function (clientData) {
                data = clientData.clientBasicDetails;
                scope.officesforDropDown = data.officeOptions;
            });
            scope.changeOffice=function(officeId){
                var requestParams1 = {staffInSelectedOfficeOnly:true,loanOfficersOnly:true,officeId:officeId};
                resourceFactory.clientTemplateResource.get(requestParams1, function (clientData) {
                    data = clientData.clientBasicDetails;
                    scope.loanOfficers = data.staffOptions;
                });
            }
           scope.changeclientOffice=function(officeId){
               var requestParamsforclients = {staffInSelectedOfficeOnly:true,officeId:officeId};
               resourceFactory.clientTemplateResource.get(requestParamsforclients, function (clientData) {
                   data = clientData.clientBasicDetails;
                   scope.staffs = data.staffOptions;
               });

           }
            scope.getResultsPage = function (pageNumber) {
                if(scope.searchText){
                    var startPosition = (pageNumber - 1) * scope.centersPerPage;
                    scope.centers = scope.actualCenters.slice(startPosition, startPosition + scope.centersPerPage);
                    return;
                }
                var items = resourceFactory.centerResource.get({
                    offset: ((pageNumber - 1) * scope.centersPerPage),
                    limit: scope.centersPerPage,
                    paged: 'true',
                    orderBy: 'name',
                    sortOrder: 'ASC'
                }, function (data) {
                    scope.centers = data.pageItems;
                });
            }
            scope.initPage = function (officeId) {
                var items = resourceFactory.centerResource.get({
                    officeId: officeId,
                    offset: 0,
                    limit: scope.centersPerPage,
                    paged: 'true',
                    orderBy: 'name',
                    sortOrder: 'ASC'
                }, function (data) {
                    scope.totalCenters = data.totalFilteredRecords;
                    scope.centers = data.pageItems;
                });
            }
            scope.search1 = function (searchText) {
                scope.actualCenters = [];
                scope.searchResults = [];

                    resourceFactory.globalSearch.search({query: searchText ,  resource: "groups"}, function (data) {
                        var arrayLength = data.length;
                        for (var i = 0; i < arrayLength; i++) {
                            var result = data[i];
                            var center = {};
                            center.status = {};
                            center.subStatus = {};
                            if(result.entityType  == 'CENTER') {
                                center.name = result.entityName;
                                center.id = result.entityId;
                                center.officeName = result.parentName;
                                center.status.value = result.entityStatus.value;
                                center.status.code = result.entityStatus.code;
                                center.externalId = result.entityExternalId;
                                scope.actualCenters.push(center);
                            }
                        }
                        var numberOfCenters = scope.actualCenters.length;
                        scope.totalCenters = numberOfCenters;
                        scope.centers = scope.actualCenters.slice(0, scope.centersPerPage);
                    });

            }

            scope.initPage(scope.formData.officeId);

            scope.viewUser = function (item) {
                scope.userTypeahead = true;
                scope.formData.user = item.id;
            };
            scope.checkerInboxAllCheckBoxesClicked = function() {
                var newValue = !scope.checkerInboxAllCheckBoxesMet();
                if(!angular.isUndefined(scope.searchData)) {
                    for (var i = scope.searchData.length - 1; i >= 0; i--) {
                        scope.checkData[scope.searchData[i].id] = newValue; 
                    };
                }
            }
            scope.checkerInboxAllCheckBoxesMet = function() {
                var checkBoxesMet = 0;
                if(!angular.isUndefined(scope.searchData)) {
                    _.each(scope.searchData, function(data) {
                        if(_.has(scope.checkData, data.id)) {
                            if(scope.checkData[data.id] == true) {
                                checkBoxesMet++;
                            }
                        }
                    });
                    return (checkBoxesMet===scope.searchData.length);
                }
            }
            scope.clientApprovalAllCheckBoxesClicked = function(officeName) {
                var newValue = !scope.clientApprovalAllCheckBoxesMet(officeName);
                if(!angular.isUndefined(scope.groupedClients[officeName])) {
                    for (var i = scope.groupedClients[officeName].length - 1; i >= 0; i--) {
                        scope.approveData[scope.groupedClients[officeName][i].id] = newValue; 
                    };
                }
            }
            scope.clientApprovalAllCheckBoxesMet = function(officeName) {
                var checkBoxesMet = 0;
                if(!angular.isUndefined(scope.groupedClients[officeName])) {
                    _.each(scope.groupedClients[officeName], function(data) {
                        if(_.has(scope.approveData, data.id)) {
                            if(scope.approveData[data.id] == true) {
                                checkBoxesMet++;
                            }
                        }
                    });
                    return (checkBoxesMet===scope.groupedClients[officeName].length);
                }
            }
            scope.loanApprovalAllCheckBoxesClicked = function(office) {
                var newValue = !scope.loanApprovalAllCheckBoxesMet(office);
                if(!angular.isUndefined(scope.offices)) {
                    for (var i = office.loans.length - 1; i >= 0; i--) {
                        scope.loanTemplate[office.loans[i].id] = newValue; 
                    };
                }
            }
            scope.loanApprovalAllCheckBoxesMet = function(office) {
                var checkBoxesMet = 0;
                if(!angular.isUndefined(scope.offices)) {
                    _.each(office.loans, function(data) {
                        if(_.has(scope.loanTemplate, data.id)) {
                            if(scope.loanTemplate[data.id] == true) {
                                checkBoxesMet++;
                            }
                        }
                    });
                    return (checkBoxesMet===office.loans.length);
                }
            }
            scope.loanDisbursalAllCheckBoxesClicked = function() {
                var newValue = !scope.loanDisbursalAllCheckBoxesMet();
                if(!angular.isUndefined(scope.loans)) {
                    for (var i = scope.loans.length - 1; i >= 0; i--) {
                        if(scope.loans[i].status.id==200) {
                            scope.loanDisbursalTemplate[scope.loans[i].id] = newValue;
                        }
                    };
                }
            }
            scope.loanDisbursalAllCheckBoxesMet = function() {
                var checkBoxesMet = 0;
                if(!angular.isUndefined(scope.loans)) {
                    _.each(scope.loans, function(data) {
                        if(_.has(scope.loanDisbursalTemplate, data.id)) {
                            if(scope.loanDisbursalTemplate[data.id] == true) {
                                checkBoxesMet++;
                            }
                        }
                    });
                    return (checkBoxesMet===scope.loans.length);
                }
            }
            scope.approveOrRejectChecker = function (action) {
                if (scope.checkData) {
                    $modal.open({
                        templateUrl: 'approvechecker.html',
                        controller: CheckerApproveCtrl,
                        resolve: {
                            action: function () {
                                return action;
                            }
                        }
                    });
                }
            };
            var CheckerApproveCtrl = function ($scope, $modalInstance, action) {
                $scope.approve = function () {
                    var totalApprove = 0;
                    var approveCount = 0;
                    _.each(scope.checkData, function (value, key) {
                        if (value == true) {
                            totalApprove++;
                        }
                    });
                    _.each(scope.checkData, function (value, key) {
                        if (value == true) {

                            resourceFactory.checkerInboxResource.save({templateResource: key, command: action}, {}, function (data) {
                                approveCount++;
                                if (approveCount == totalApprove) {
                                    scope.search();
                                }
                            }, function (data) {
                                approveCount++;
                                if (approveCount == totalApprove) {
                                    scope.search();
                                }
                            });
                        }
                    });
                    scope.checkData = {};
                    $modalInstance.close('approve');

                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };

            scope.deleteChecker = function () {
                if (scope.checkData) {
                    $modal.open({
                        templateUrl: 'deletechecker.html',
                        controller: CheckerDeleteCtrl
                    });
                }
            };
            var CheckerDeleteCtrl = function ($scope, $modalInstance) {
                $scope.delete = function () {
                    var totalDelete = 0;
                    var deleteCount = 0
                    _.each(scope.checkData, function (value, key) {
                        if (value == true) {
                            totalDelete++;
                        }
                    });
                    _.each(scope.checkData, function (value, key) {
                        if (value == true) {

                            resourceFactory.checkerInboxResource.delete({templateResource: key}, {}, function (data) {
                                deleteCount++;
                                if (deleteCount == totalDelete) {
                                    scope.search();
                                }
                            }, function (data) {
                                deleteCount++;
                                if (deleteCount == totalDelete) {
                                    scope.search();
                                }
                            });
                        }
                    });
                    scope.checkData = {};
                    $modalInstance.close('delete');
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };

            scope.approveClient = function () {
                if (scope.approveData) {
                    $modal.open({
                        templateUrl: 'approveclient.html',
                        controller: ApproveClientCtrl,
                        resolve: {
                            items: function () {
                                return scope.approveData;
                            }
                        }
                    });
                }
            };

            $(window).scroll(function () {
                if ($(this).scrollTop() > 100) {
                    $('.head-affix').css({
                        "position": "fixed",
                        "top": "50px"
                    });

                } else {
                    $('.head-affix').css({
                        position: 'static'
                    });
                }
            });

            var ApproveClientCtrl = function ($scope, $modalInstance, items) {
                $scope.restrictDate = new Date();
                $scope.date = {};
                $scope.date.actDate = new Date();
                $scope.approve = function (act) {
                    var activate = {}
                    activate.activationDate = dateFilter(act, scope.df);
                    activate.dateFormat = scope.df;
                    activate.locale = scope.optlang.code;
                    var totalClient = 0;
                    var clientCount = 0
                    _.each(items, function (value, key) {
                        if (value == true) {
                            totalClient++;
                        }
                    });

                    scope.batchRequests = [];
                    scope.requestIdentifier = "clientId";

                    var reqId = 1;
                    _.each(items, function (value, key) {                         
                        if (value == true) {
                            scope.batchRequests.push({requestId: reqId++, relativeUrl: "clients/"+key+"?command=activate", 
                            method: "POST", body: JSON.stringify(activate)});                        
                        }
                    });

                    resourceFactory.batchResource.post(scope.batchRequests, function (data) {
                        for(var i = 0; i < data.length; i++) {
                            if(data[i].statusCode = '200') {
                                clientCount++;
                                if (clientCount == totalClient) {
                                    route.reload();
                                }
                            }
                            
                        }    
                    });

                    scope.approveData = {};
                    $modalInstance.close('delete');
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            };

            scope.routeTo = function (id) {
                location.path('viewcheckerinbox/' + id);
            };

            scope.routeToClient = function (id) {
                location.path('viewclient/' + id);
            };
            scope.routeToCenter = function(id){
                location.path('jlgloanAccountcenterby/' + id);

            };
            scope.loanApprovalAndDisburse=function (officeId,loanOfficeId) {
                     scope.sql='';
                     if(loanOfficeId!=null && officeId!=null ) {
                         scope.sql = "l.loan_status_id in (100,200) and o.id = " + officeId + " and l.loan_officer_id =" + loanOfficeId;
                     }
                    else if (officeId!=null){
                         scope.sql = "l.loan_status_id in (100,200) and o.id = " + officeId ;
                     }
                    else{
                         scope.sql = "l.loan_status_id in (100,200)";
                     }
                resourceFactory.officeResource.getAllOffices(function (data) {
                    scope.offices = data;
                    for (var i in data) {
                        data[i].loans = [];
                        idToNodeMap[data[i].id] = data[i];
                    }
                    scope.loanResource = function () {
                        resourceFactory.loanResource.getAllLoans({
                            "sqlSearch":  scope.sql,      //"l.loan_status_id in (100,200)",
                            "groupSearch": true,
                            "orderBy": "centerId"
                        }, function (loanData) {
                            scope.loans = loanData.pageItems;
                            for (var i in scope.loans) {
                                if (scope.loans[i].status.pendingApproval) {
                                    var tempOffice = undefined;
                                    if (scope.loans[i].clientOfficeId) {
                                        tempOffice = idToNodeMap[scope.loans[i].clientOfficeId];
                                        tempOffice.loans.push(scope.loans[i]);
                                    } else {
                                        if (scope.loans[i].group) {
                                            tempOffice = idToNodeMap[scope.loans[i].group.officeId];
                                            tempOffice.loans.push(scope.loans[i]);
                                        }
                                    }
                                }
                            }

                            var finalArray = [];
                            for (var i in scope.offices) {
                                if (scope.offices[i].loans && scope.offices[i].loans.length > 0) {
                                    finalArray.push(scope.offices[i]);
                                }
                            }
                            scope.offices = finalArray;
                        });
                    };
                    scope.loanResource();
                });
            }
            scope.clientPendingforApproval=function(officeId,staffId) {
                scope.sqlsearchforclient='';
                if(staffId!=null && officeId!=null){
                    scope.sqlsearchforclient="c.status_enum like 100 and c.office_id = "+officeId +" and  c.staff_id = "+staffId ;
                }
                else if(officeId!=null){
                    scope.sqlsearchforclient="c.status_enum like 100 and c.office_id = "+officeId ;
                }
                else{
                    scope.sqlsearchforclient="c.status_enum like 100";
                }
                resourceFactory.clientResource.getAllClients({
                    "sqlSearch": scope.sqlsearchforclient,
                    "groupSearch": true,
                    "order by" :"centerId"
                }, function (data) {
                    scope.groupedClients = _.groupBy(data.pageItems, "officeName");
                });
            }
            scope.search = function () {
                scope.isCollapsed = true;
                var reqFromDate = dateFilter(scope.date.from, 'yyyy-MM-dd');
                var reqToDate = dateFilter(scope.date.to, 'yyyy-MM-dd');
                var params = {};
                if (scope.formData.action) {
                    params.actionName = scope.formData.action;
                }
                ;

                if (scope.formData.entity) {
                    params.entityName = scope.formData.entity;
                }
                ;

                if (scope.formData.resourceId) {
                    params.resourceId = scope.formData.resourceId;
                }
                ;

                if (scope.formData.user) {
                    params.makerId = scope.formData.user;
                }
                ;

                if (scope.date.from) {
                    params.makerDateTimeFrom = reqFromDate;
                }
                ;

                if (scope.date.to) {
                    params.makerDateTimeto = reqToDate;
                }
                ;
                resourceFactory.checkerInboxResource.search(params, function (data) {
                    scope.searchData = data;
                    if (scope.userTypeahead) {
                        scope.formData.user = '';
                        scope.userTypeahead = false;
                        scope.user = '';
                    }
                });
            };

            scope.approveLoan = function () {
                if (scope.loanTemplate) {
                    $modal.open({
                        templateUrl: 'approveloan.html',
                        controller: ApproveLoanCtrl
                    });
                }
            };

            var ApproveLoanCtrl = function ($scope, $modalInstance) {
                $scope.date = {};
                $scope.restrictDate = new Date();
                $scope.date.approveDate = new Date();

                $scope.approve = function (e) {
                    scope.bulkApproval(e);

                    $modalInstance.close('approve');
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            }

            scope.bulkApproval = function (e) {

                var approveData={};
                approveData.approvedOnDate = dateFilter(e, scope.df);
                approveData.dateFormat = scope.df;
                approveData.locale = scope.optlang.code;
                var selectedAccounts = 0;
                var approvedAccounts = 0;
                _.each(scope.loanTemplate, function (value, key) {
                    if (value == true) {
                        selectedAccounts++;
                    }
                });

                scope.batchRequests = [];
                scope.requestIdentifier = "loanId";

                var reqId = 1;
                _.each(scope.loanTemplate, function (value, key) { 
                    if (value == true) {
                        scope.batchRequests.push({requestId: reqId++, relativeUrl: "loans/"+key+"?command=approve", 
                        method: "POST", body: JSON.stringify(approveData)});
                    }
                });

                resourceFactory.batchResource.post(scope.batchRequests, function (data) {
                    for(var i = 0; i < data.length; i++) {
                        if(data[i].statusCode = '200') {
                            approvedAccounts++;
                            data[i].body = JSON.parse(data[i].body);
                            scope.loanTemplate[data[i].body.loanId] = false;
                            if (selectedAccounts == approvedAccounts) {
                                scope.loanResource();
                                route.reload();
                            }
                        }
                        
                    }    
                });
            };

            scope.disburseLoan = function () {
                if (scope.loanDisbursalTemplate) {
                    $modal.open({
                        templateUrl: 'disburseloan.html',
                        controller: DisburseLoanCtrl
                    });
                }
            };

            var DisburseLoanCtrl = function ($scope, $modalInstance) {
                $scope.date = {};
                $scope.restrictDate = new Date();
                $scope.date.disburseDate =new Date();

                $scope.disburse = function (e) {
                    scope.bulkDisbursal(e);

                    $modalInstance.close('disburse');
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            }

            scope.bulkDisbursal = function (e) {
                scope.disburseData={};
                scope.disburseData.actualDisbursementDate = dateFilter(e, scope.df);
                scope.disburseData.dateFormat = scope.df;
                scope.disburseData.locale = scope.optlang.code;

                var selectedAccounts = 0;
                var approvedAccounts = 0;
                _.each(scope.loanDisbursalTemplate, function (value, key) {
                    if (value == true) {
                        selectedAccounts++;
                    }
                });

                scope.batchRequests = [];      
                scope.requestIdentifier = "loanId";          

                var reqId = 1;
                _.each(scope.loanDisbursalTemplate, function (value, key) { 
                    if (value == true) {
                        scope.batchRequests.push({requestId: reqId++, relativeUrl: "loans/"+key+"?command=disburse", 
                        method: "POST", body: JSON.stringify(scope.disburseData)});
                    }
                });

                resourceFactory.batchResource.post(scope.batchRequests, function (data) {
                    for(var i = 0; i < data.length; i++) {
                        if(data[i].statusCode = '200') {
                            approvedAccounts++;
                            data[i].body = JSON.parse(data[i].body);
                            scope.loanDisbursalTemplate[data[i].body.loanId] = false;
                            if (selectedAccounts == approvedAccounts) {
                                scope.loanResource();
                            }
                        }
                        
                    }    
                });
            };

        }
    });
    mifosX.ng.application.controller('TaskController', ['$scope', 'ResourceFactory', '$route', 'dateFilter', '$modal', '$location','$scope','$timeout', mifosX.controllers.TaskController]).run(function ($log) {
        $log.info("TaskController initialized");
    });
}(mifosX.controllers || {}));
