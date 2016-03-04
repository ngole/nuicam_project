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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Loads a single article
     * @class ArticleViewController
     * @constructor
     * @extends BaseController
     */
    function ArticleEnViewController(){}
    util.inherits(ArticleEnViewController, pb.BaseController);

    /**
     * @method init
     * @param {Object} content
     * @param {Function} cb
     */
    ArticleEnViewController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            if (util.isError(err)) {
                return cb(err);
            }

            //create the service
            self.service = new pb.ArticleServiceV2(self.getServiceContext());

            //create the loader context
            var context     = self.getServiceContext();
            context.service = self.service;
            self.contentViewLoader = new pb.ContentViewLoader(context);
            self.dao                   = new pb.DAO();
            cb(null, true);
        };
        ArticleEnViewController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     * @method render
     * @param {Function} cb
     */
    ArticleEnViewController.prototype.render = function(cb) {
        var self    = this;
        var custUrl = this.pathVars.customUrl;

        //attempt to load object
        var opts = {
            render: true,
            where: this.getWhereClause(custUrl)
        };
        this.service.getSingle(opts, function(err, article) {
            //console.log(article);
            if (util.isError(err)) {
                return cb(err);
            }
            else if (article == null) {
                return self.reqHandler.serve404();
            }
            self.getContent(function(err, data){
                var options = {};
                self.contentViewLoader.render_en([article], data, options, function(err, html) {
                    if (util.isError(err)) {
                        return cb(err);
                    }

                    var result = {
                        content: html
                    };
                    cb(result);
                });
            });
        });
    };

    /**
     * Builds out the where clause for finding the article to render.  Because
     * MongoDB has an object ID represented by 12 characters we must account
     * for this condition by building a where clause with an "or" condition.
     * Otherwise we will only query on the url key
     * @method getWhereClause
     * @param {String} custUrl Represents the article's ID or its slug
     * @return {Object} An object representing the where clause to use in the
     * query to locate the article
     */
    ArticleEnViewController.prototype.getWhereClause = function(custUrl) {

        //put a check to look up by ID *FIRST*
        var conditions = [];
        if(pb.validation.isIdStr(custUrl, true)) {
            conditions.push(pb.DAO.getIdWhere(custUrl));
        }

        //put a check to look up by URL
        conditions.push({
            url_en: custUrl
        });

        //check for object ID as the custom URL
        var where;
        if (conditions.length > 1) {
            where = {
                $or: conditions
            };
        }
        else {
            where = conditions[0];
        }
        return where;
    };

    ArticleEnViewController.prototype.getContent = function(cb) {
        var self = this;
        //lookup by URL
        var content ={};
        self.dao.loadByValue('name','TIN TỨC VÀ SỰ KIỆN', 'topic', function (err, news_section) {
            if (util.isError(err) || news_section == null) {
                return cb(null, null);
            }
            var opts_news = {
                render: true,
                where: {},
                limit: 5,
                offset: 0,
                order: [{'publish_date': pb.DAO.DESC}, {'created': pb.DAO.DESC}]
            };
            pb.ContentObjectService.setPublishedClause(opts_news.where);
            self.service.getNewsBySection(news_section, opts_news, content, function (err, news_content) {
                content.news_content = news_content;
                self.dao.loadByValue('name', 'VĂN BẢN MỚI', 'topic', function (err, docs_section){
                    if(util.isError(err) || docs_section == null){
                        return cb(null, null);
                    }
                    var opts_docs = {
                        render: true,
                        where: {},
                        limit: 5,
                        offset: 0,
                        order: [{'publish_date': pb.DAO.DESC}, {'created': pb.DAO.DESC}]
                    };
                    pb.ContentObjectService.setPublishedClause(opts_docs.where);
                    self.service.getDocsBySection(docs_section, opts_docs, content, function(err, docs_content){
                        content.docs_content = docs_content;
                        var result = {
                            content: content
                        };
                        cb(err, result);
                    });
                });
            });
        });
    };

    //exports
    return ArticleEnViewController;
};
