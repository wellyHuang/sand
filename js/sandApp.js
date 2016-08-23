var sandApp = angular.module('sandApp', []);

sandApp.controller('sandDashCtrl', ['$scope', '$sce', function($scope, $sce) {
    $scope.mpd_url = $sce.trustAsResourceUrl("http://dash.edgesuite.net/dash264/TestCases/1a/sony/SNE_DASH_SD_CASE1A_REVISED.mpd");

    $scope.video = [];
    $scope.metrics = [];
    $scope.demoStarted = false;
    $scope.connectedToDane = false;
    player = [];
    
    $scope.startDemo = function() {

        $scope.demoStarted = true;

        player.play();
        player.on(dashjs.MediaPlayer.events.METRICS_CHANGED, $.throttle(1000, sendMetric));
        player.on(dashjs.MediaPlayer.events.ERROR, onError);

        var client_id = uuid.v4();

        // SAND channel set-up
        var ws = new WebSocket('ws://dane-demo.herokuapp.com?client_id=' + client_id);

        ws.onopen = function () {
            console.log('SAND|INFO|Connected to DANE !');
            $scope.connectedToDate = true;
        };

        // Log errors
        ws.onerror = function (e) {
            console.log('SAND|ERROR|WebSocket Error ' + e);
        };

        // Log messages from the server
        ws.onmessage = function (e) {
            console.log('SAND|INFO|DANE: ' + e.data);
            var message;
            try {
                message = JSON.parse(e.data);
                $scope.metrics = message;
                $scope.$apply();
            } catch (err) {
                console.log('SAND|ERROR|No JSON data');
                console.log('SAND|ERROR|' + err);
            }
        };
  

    };
    
    function onError(e) {
        console.log("SAND|ERROR|" + e);
    }

    function sendMetric(e) {
        var metrics = player.getMetricsFor("video");
        if($scope.connectedToDane) ws.send(JSON.stringify(metrics));
    }

    $scope.$watch('video', function() {
        player = dashjs.MediaPlayerFactory.create($scope.video[0]);
    });
    
    $scope.getTotal = function(what) {
        switch(what) {
            case "clients": 
                return $scope.metrics.length;
            case "data": 
                var a = $scope.metrics.map(function(c) { return c.dl_media_data; });
                return _.reduce(a, function(accu, i){ return accu + i; }, 0);
            case "segments":
                var b = $scope.metrics.map(function(c) { return c.dl_segments; });
                return _.reduce(b, function(accu, i){ return accu + i; }, 0);
            default:
                console.log("SAND|ERROR|Unknown quantity to sum.");
        }
        return "";
    };
}]);

sandApp.directive('dashPlayer', function() {
    function link(scope, element, attrs) {
        scope.video = element;
    }
    
    return {
        link: link,
        scope: false
    };
});

sandApp.filter('filesize', function() {
  return function(input) {
    return filesize(input);
  };
});
