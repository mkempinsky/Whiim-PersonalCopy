(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['FirebaseFactory', '$stateParams', '$state', '$scope', '$ionicPopover', '$sessionStorage', 'toastr', '$firebaseArray', 'GeolocationFactory', '$ionicLoading', '$rootScope'];

    /* @ngInject */
    function DashboardController(FirebaseFactory, $stateParams, $state, $scope, $ionicPopover, $sessionStorage, toastr, $firebaseArray, GeolocationFactory, $ionicLoading, $rootScope) {
        var vm = this;
        vm.title = 'DashboardController';
        vm.test = 'this is a test from DashboardController';
        vm.logOff = logOff;
        vm.category = '';
        vm.cardDestroyed = cardDestroyed;
        vm.cardSwiped = cardSwiped;
        vm.currentCard = [];
        // vm.user = {};
        // vm.pullEventsByCategory = [];
        vm.pullEventsByCategory = pullEventsByCategory;
        // vm.events = [];
        var eventsInRange  = [];
        
        var uid = $sessionStorage.uid;
        
        activate();
        pullEventsByCategory();

        //reminder used $scope.user to make scope available in ionic popover

       $scope.setOwnerId = function(requestor) {
       
            // FirebaseFactory.returnUserFromDB(id).then(function(requestor) {

                $scope.requestor = requestor;
               
            
        }

        function initiateDeck(events) {
            // vm.eventsByCategory = Object.keys(events).map(function(property) {
            //             return {key: property, value: events[property] };
            // });
            
            console.log(events);

            vm.currentCard.push( events.pop());

                    


        }

        function pullEventsByCategory() {

            vm.currentCard = [];
            
            var events = {};
            var ref = {};
            if(vm.category === 'Select a Category' || vm.category === 'Anything Goes!') {
                ref = firebase.database().ref('/events');
            } else {
                 ref = firebase.database().ref('/events').orderByChild('category').equalTo(vm.category);
            }
            var eventsArray = $firebaseArray(ref);
            console.log(eventsArray);

            //get events searchRef 
            //get users declined

            //will pass in searchRef 

            FirebaseFactory.getCardDecisionInfo(ref).then(
                function(values) {
                   //////////////////////////////////////////////////////////////////
                   console.log(values);
                   var events = values[0];
                   var declined = values[1];
                   var declinedKeys = Object.keys(declined)
                   var eventKeys = Object.keys(events);

                   // turn event object into array
                   var eventArray = eventKeys.map(function(key) {
                    var rArr = [];
                    rArr.push(events[key]);
                    return rArr;

                   });

                  

                 

                   //loop through eventArray
                   eventArray.forEach(function(event) {
                        var isMember = false;
                        var isDeclined = false
                        console.log(event[0]);
                        //if event has members array

                        ////////////////////////////////////////////////////////////////////////////////////
                        // check if already a member of event
                        if(event[0].members) {
                            var membersArray = event[0].members;
                            var membersInEvent = Object.keys(membersArray);

                            //loop through each memberid
                            membersInEvent.forEach(function(memberId) {
                              
                                console.log(memberId);
                                if(memberId === $sessionStorage.uid) {
                                    isMember = true;
                                }
                            }) // end loop through membersInEvent
                        }// end if (event[0].members)

                        //////////////////////////////////////////////////////////////////////////////////////
                        // check if event key is already in your declined
                        declinedKeys.forEach(
                            function(declinedKey) {
                                console.log(declinedKey)
                                if(declinedKey === event[0].eventKey) {
                                    isDeclined = true;
                                    console.log('declined.............................')
                                }   else {
                                    console.log('not declined.............................');
                                }
                            }
                        )

                        //////////////////////////////////////////////////////////////////////////////////////

                        console.log(event[0].coords);
                        console.log($sessionStorage.coords);
                        if(GeolocationFactory.getIsEventInArea(event[0].coords, $sessionStorage.coords, $sessionStorage.searchRadius)) {
                            console.log('do something if in range: TRUE');
                            if(!isMember && !isDeclined) {
                                eventsInRange.push(event[0]);
                                console.log('added because not a member');
                            } else {
                                console.log(event[0]+ ': not added because already a member or is declined');
                            }

                        } else {
                            console.log('do something if out of range: FALSE');
                        }



                   })// end loop through event array
                   console.log(eventsInRange);
                    if(eventsInRange.length > 0) {
                        initiateDeck(eventsInRange);
                    } else {
                        // swal("Dang", "Looks like there are no events of that type in your area, maybe checkout a different category?", "warning");
                    }


                   
                   //////////////////////////////////////////////////////////////////
                }, 
                function(error) {
                    console.log('---------------------------------------------------------------------------------------------------------------------------------------')
                    console.log(error);
                     var ref = {};
                    if(vm.category === 'Select a Category' || vm.category === 'Anything Goes!') {
                        ref = firebase.database().ref('/events');
                        console.log('/events')
                    } else {
                         ref = firebase.database().ref('/events').orderByChild('category').equalTo(vm.category);
                         console.log('category picked');
                    }

                    FirebaseFactory.returnLoadedSnapshot(ref).then(
                        function(events) {
                            var eventsToPush = [];
                            console.log(events);
                            var eventKeys = Object.keys(events);
                            var eventArray = eventKeys.map(function(key) {
                            var rArr = [];
                            rArr.push(events[key]);
                            return rArr;

                           });

                            eventArray.forEach(
                                function(event) {
                                    console.log(event);
                                    eventsInRange.push(event[0]);
                                }
                            )

                            console.log(eventsInRange);
                            initiateDeck(eventsInRange);

                        }
                    )




                }
            )

            


            // eventsArray.$loaded().then(
            //     function(events) {
                    

            //         events.forEach(function(e) {
            //             var isMember = false;
                        
            //             if(e.members) {
                           
            //                 var memberKeys = Object.keys(e.members);
            //                 memberKeys.forEach(
            //                     function(key) {
            //                         if (key === $sessionStorage.uid) {
                                        
            //                             isMember = true;
            //                         }
            //                     }
            //                 )
            //             } // end if(e.members)
                       
            //             if(GeolocationFactory.getIsEventInArea(e.coords, $sessionStorage.coords)) {
            //                 console.log('do something if in range: TRUE');
            //                 if(!isMember) {
            //                     eventsInRange.push(e);
            //                     console.log('added because not a member');
            //                 } else {
            //                     console.log(e + ': not added because already a member');
            //                 }

            //             } else {
            //                 console.log('do something if out of range: FALSE');
            //             }
            //         })
            //         console.log(eventsInRange);
            //         if(eventsInRange.length > 0) {
            //             initiateDeck(eventsInRange);
            //         } else {
            //             swal("Dang", "Looks like there are no events of that type in your area, maybe checkout a different category?", "warning");
            //         }
            //     }
            // )

           

        }
        
      

        

        function cardDestroyed(index) {
            vm.currentCard.splice(index, 1);
            console.log(index);
            firebase.database().ref('users/' + $sessionStorage.uid + '/viewedEvents/' + index.eventKey).update({declined: true});
            

            if(eventsInRange.length > 0) {
                vm.currentCard.push( eventsInRange.pop());
            } else {
                swal("Dang", "Looks like you're all out of cards, maybe checkout a different category?", "warning");
            }
            
        }

        function cardSwiped(card) {
            //reference to notifications/receiverId/senderId
          

             var notifRef = firebase.database().ref('/users/' + card.ownerId + '/notifications/' + uid );
             

             

          


             
                      
                        //set active true and time stamp
                        //grab ref to notifications/card.value.userid
                        var notification = {
                             "active": true,
                            "timeStamp": Date.now(),
                            "ownerName": $sessionStorage.displayName,
                            "eventKey": card.eventKey,
                            "prefix": 'wants to join ',
                            "title": card.name,
                            "photoURL": $sessionStorage.photoURL,
                            "pending": true

                        };

                        console.log(notification);

                       
                        notifRef.set(notification);
                        
                        toastr.success("Notification sent to " + card.ownerName);


          
        }

        $ionicPopover.fromTemplateUrl('js/tabs/dashboard/popover.select.html', {
             scope: $scope,
         }).then(function(popover) {
             $scope.popover = popover;
         });

         $scope.closePopover = function($event) {
            $scope.popover.hide();
         };

         $ionicPopover.fromTemplateUrl('js/tabs/dashboard/popover.details.html', {
             scope: $scope,
         }).then(function(popover2) {
             $scope.popover2 = popover2;
         });

         $scope.closePopover2 = function($event) {
            $scope.popover2.hide();
         };

         $ionicPopover.fromTemplateUrl('js/tabs/dashboard/popover.settings.html', {
             scope: $scope,
         }).then(function(popover3) {
             $scope.popover3 = popover3;
         });

         $scope.closePopover3 = function($event) {
            $scope.popover3.hide();
         };  

         $scope.setCategory = function(category){
            vm.category = category;
                    pullEventsByCategory();
         };

         // $scope.setRadius = function(category){
         //    vm.radius = '';
         // };



        function logOff() {FirebaseFactory.logOff()}       
        
        function ContentController($scope, $ionicSideMenuDelegate) {
            $scope.toggleLeft = function() {
                $ionicSideMenuDelegate.toggleLeft();
            };
        }

        $scope.saveRadius = function(radius) {
            console.log(radius);

            $sessionStorage.searchRadius = radius;
            vm.DataBaseRefToLoggedInUser = firebase.database().ref('users/' + uid);
            vm.DataBaseRefToLoggedInUser.update({radius: radius});
            console.log($sessionStorage.searchRadius);

        }


      
        
        activate();

        ////////////////

        function activate() {
            vm.category = 'Select a Category';
        }
    }
})();