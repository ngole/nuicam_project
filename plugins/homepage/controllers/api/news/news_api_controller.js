module.exports = function(pb){
    var util = pb.util;
    var BaseController = pb.BaseController;

    function news_api_controller(){};
    util.inherits(news_api_controller, BaseController);

    news_api_controller.prototype.helloWorld = function(cb){
        var output = {
            content_type:'text/html',
            code:200
        };
        this.ts.load('hello_world',function(error, result){
            output.content = result;
            cb(output);
        });
    };
    //news_api_controller.getRoutes = function(cb) {
    //    var routes = [{
    //        method: 'get',
    //        path: "/hello-world",
    //        handler: 'helloWorld',
    //        auth_required: false,
    //        content_type: 'text/html'
    //    }];
    //    cb(null, routes);
    //};


    return news_api_controller;
}
