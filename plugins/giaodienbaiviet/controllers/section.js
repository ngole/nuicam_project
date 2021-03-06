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
     * Loads a section
     * @class SectionViewController
     * @constructor
     * @extends BaseController
     */
    function SectionViewController(){}
    util.inherits(SectionViewController, pb.BaseController);

    /**
     * @method init
     * @param {Object} content
     * @param {Function} cb
     */
    SectionViewController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            //get content settings
            var serviceContext = self.getServiceContext();
            var contentService = new pb.ContentService(serviceContext);
            contentService.getSettings(function(err, contentSettings) {
                if (util.isError(err)) {
                    return cb(err);
                }
                //create the service
                self.contentSettings = contentSettings;
                var asContext = self.getServiceContext();
                asContext.contentSettings = contentSettings;
                self.service = new pb.ArticleServiceV2(asContext);

                //create the loader context
                var cvlContext             = self.getServiceContext();
                cvlContext.contentSettings = contentSettings;
                cvlContext.service         = self.service;
                self.contentViewLoader     = new pb.ContentViewLoader(cvlContext);

                //provide a dao
                self.dao                   = new pb.DAO();
                //console.log(cvlContext);
                cb(null, true);
            });
        };
        SectionViewController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     * @method render
     * @param {Function} cb
     */
    SectionViewController.prototype.render = function(cb) {
        var self    = this;
        var custUrl = this.pathVars.customUrl;
        var page = this.query.page-1;
        var offset = page*self.contentSettings.articles_per_page;
        if(page<0){
            return self.reqHandler.serve404();
        }
        //console.log(custUrl);

        this.getContent(custUrl, offset, function(err, data) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!util.isObject(data)) {
                return self.reqHandler.serve404();
            }

            var options = {
                section: data.section
            };

            var optsCount = {
                render: false,
                where: {}
            };
            pb.ContentObjectService.setPublishedClause(optsCount.where);
            var content = data.content;
            self.service.getCountBySection(data.section, content, optsCount, function(err, count) {
                content.push(Math.ceil(count/self.contentSettings.articles_per_page));
                self.contentViewLoader.render(content, null, options, function(err, html) {
                    if (util.isError(err)) {
                        return cb(err);
                    }

                    var result = {
                        content: html
                    };
                    //console.log(html);
                    cb(result);
                });
            });

        });
    };

    /**
     * Retrieves the content to be displayed and rendered
     * @method getContent
     * @param {String} custUrl The URL slug of the section
     * @param {Function} cb
     */
    SectionViewController.prototype.getContent = function(custUrl, offset, cb) {
        var self = this;
        //lookup by URL
        self.dao.loadByValue('url', custUrl, 'section', function(err, section) {
            if (util.isError(err) || section == null) {
                return cb(null, null);
            }
            var opts = {
                render: true,
                where: {},
                limit: self.contentSettings.articles_per_page || 5,
                offset: offset,
                order: [{'publish_date': pb.DAO.DESC}, {'created': pb.DAO.DESC}]
            };
            pb.ContentObjectService.setPublishedClause(opts.where);
            self.service.getBySection(section, opts, function(err, content) {
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
                                    section: section,
                                    content: content
                                };
                                //console.log(result);
                                cb(err, result);
                            });
                        });
                    });
                });
            });
        });
    };

    //exports
    return SectionViewController;
};
