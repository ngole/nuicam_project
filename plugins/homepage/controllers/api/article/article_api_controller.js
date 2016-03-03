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
    var article_news = pb.ArticleNews;

    function article_api_controller(){};
    util.inherits(article_api_controller, BaseController);
    article_api_controller.prototype.getAllArticle = function(cb){
        var data = content_view_loader.getArticleApi();
        cb({
            content: BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', data)
        });
    };

    article_api_controller.prototype.getArticlesNews = function(cb){
        var data = article_news.getArticlesNews();
        cb({
            content: BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', data)
        });
    }

    //exports
    return article_api_controller;
};
