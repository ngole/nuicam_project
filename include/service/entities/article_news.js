//dependencies
var async = require('async');
var util  = require('../../util.js');

/**
 * Reusable service classes to be called from controllers
 *
 * @module Services
 */


module.exports = function ArticleNewsModule(pb){
    function ArticleNews(siteUid, onlyThisSite){
        this.object_type = ARTICLE_TYPE;
        this.site = pb.SiteService.getCurrentSite(siteUid);
        this.onlyThisSite = onlyThisSite;
        this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: onlyThisSite});
    }

    var ARTICLE_TYPE = 'article';
    var PAGE_TYPE = 'page';

    ArticleNews.prototype.getArticlesNews = function(cb){
        var opts = {
            where:{},
            order:{
                created: pb.DAO.DESC
            },
            limit: 3,
            offset: 0
        };
        var dao = new pb.DAO();
        dao.q('article', opts, function(err, article){
            if(util.isError(err)){
                cb(err);
            }
            //console.log(article);
            return article;
        });
    }

}
