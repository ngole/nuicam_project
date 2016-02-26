/*
 Copyright (C) 2015  PencilBlue, LLC

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

//dependencies
var path  = require('path');
var async = require('async');

module.exports = function(pb){
    var util = pb.util;
    var BaseController = pb.BaseController;
    var content_view_loader = pb.ContentViewLoader;

    function article_api_controller(){};
    util.inherits(article_api_controller, BaseController);
    //GetMenu.prototype.render = function(cb) {
    //    var self = this;
    //
    //
    //    this.getContent(function(err, menu) {
    //        if (util.isError(err)) {
    //            return cb(err);
    //        }
    //        var options = {};
    //        self.contentViewLoader.onContent(menu, options, function(err, content) {
    //            if (util.isError(err)) {
    //                return cb(err);
    //            }
    //
    //            //var data = {
    //            //    count: articles.length,
    //            //    articles: content.toString()
    //            //};
    //
    //            var data = 1;
    //            cb({
    //                content: BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', data)
    //            });
    //        });
    //    });
    //};
    //
    //
    //GetMenu.prototype.getContent = function(cb) {
    //
    //    var where = {};
    //
    //    //retrieve articles
    //    var opts = {
    //        render: true,
    //        where: where
    //    };
    //    this.service.getAll(opts, cb);
    //};

    article_api_controller.prototype.getAllArticle = function(cb){
        var data = content_view_loader.getArticleApi();
        cb({
            content: BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', data)
        });
    }

    //exports
    return article_api_controller;
};
