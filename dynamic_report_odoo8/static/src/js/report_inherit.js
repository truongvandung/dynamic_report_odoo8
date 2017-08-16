openerp.dynamic_report_odoo8 = function (instance) {
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;
    var wkhtmltopdf_state;

    var trigger_download = function (self, response, c) {
        var params = {
            data: JSON.stringify(response),
            token: new Date().getTime()
        };
        var url = self.session.url('/report/preview', params);
        var dialog = new instance.web.Dialog(window, false, '<iframe style="width: 100%; height: 600px" src=' + url + '/>');
        var button = function () {
            var fn = function () {};
            var text;
        }
        dialog.dialog_options = {
            destroy_on_close: true,
            size: 'large', //'medium', 'small'
            buttons: null,//[btnTest],
        };
        dialog.open();
        instance.web.unblockUI();
        return;
    }

    instance.web.ActionManager = instance.web.ActionManager.extend({
        ir_actions_report_xml: function (action, options) {
            var self = this;
            instance.web.blockUI();
            action = _.clone(action);
            _t = instance.web._t;

            // QWeb reports
            if ('report_type' in action && (action.report_type == 'qweb-html' || action.report_type == 'qweb-pdf' || action.report_type == 'controller')) {
                var report_url = '';
                switch (action.report_type) {
                    case 'qweb-html':
                        report_url = '/report/html/' + action.report_name;
                        break;
                    case 'qweb-pdf':
                        report_url = '/report/pdf/' + action.report_name;
                        break;
                    case 'controller':
                        report_url = action.report_file;
                        break;
                    default:
                        report_url = '/report/html/' + action.report_name;
                        break;
                }

                // generic report: no query string
                // particular: query string of action.data.form and context
                if (!('data' in action) || !(action.data)) {
                    if ('active_ids' in action.context) {
                        report_url += "/" + action.context.active_ids.join(',');
                    }
                } else {
                    report_url += "?options=" + encodeURIComponent(JSON.stringify(action.data));
                    report_url += "&context=" + encodeURIComponent(JSON.stringify(action.context));
                }

                var response = new Array();
                response[0] = report_url;
                response[1] = action.report_type;
                var c = openerp.webclient.crashmanager;

                if (action.report_type == 'qweb-html') {
                    window.open(report_url, '_blank', 'scrollbars=1,height=900,width=1280');
                    instance.web.unblockUI();
                } else if (action.report_type === 'qweb-pdf') {
                    // Trigger the download of the pdf/controller report
                    (wkhtmltopdf_state = wkhtmltopdf_state || openerp.session.rpc('/report/check_wkhtmltopdf')).then(function (presence) {
                        // Fallback on html if wkhtmltopdf is not installed or if OpenERP is started with one worker
                        if (presence === 'install') {
                            self.do_notify(_t('Report'), _t('Unable to find Wkhtmltopdf on this \
system. The report will be shown in html.<br><br><a href="http://wkhtmltopdf.org/" target="_blank">\
wkhtmltopdf.org</a>'), true);
                            report_url = report_url.substring(12)
                            window.open('/report/html/' + report_url, '_blank', 'height=768,width=1024');
                            instance.web.unblockUI();
                            return;
                        } else if (presence === 'workers') {
                            self.do_notify(_t('Report'), _t('You need to start OpenERP with at least two \
workers to print a pdf version of the reports.'), true);
                            report_url = report_url.substring(12)
                            window.open('/report/html/' + report_url, '_blank', 'height=768,width=1024');
                            instance.web.unblockUI();
                            return;
                        } else if (presence === 'upgrade') {
                            self.do_notify(_t('Report'), _t('You should upgrade your version of\
 Wkhtmltopdf to at least 0.12.0 in order to get a correct display of headers and footers as well as\
 support for table-breaking between pages.<br><br><a href="http://wkhtmltopdf.org/" \
 target="_blank">wkhtmltopdf.org</a>'), true);
                        }
                        
                        action.report_type = 'qweb-html'
                        report_stronger_obj = new instance.web.Model("report.stronger");
                        report_stronger_obj.call("get_html", [action.context.active_ids, action.report_name, self.inner_action.res_model]).then(function(response){
                            var dialog = new instance.web.Dialog(window, false, '<div id="ok" style="height: 400px" class="oe_form_field oe_form_field_html oe_form_embedded_html"><textarea value='+response+' /><a src='+report_url+' /></div>');
                            var button = function () {
                                var fn = function () {};
                                var text;
                            }
                            dialog.dialog_options = {
                                destroy_on_close: true,
                                size: 'large', //'medium', 'small'
                                buttons: null,//[btnTest],
                            };
                            dialog.dialog_title ='<a class="btn-print-ok fa fa-print fa-6">Print</a> &nbsp;'
                            dialog.open();
                            $('#ok').find('textarea').cleditor({'height': '100%'});
                            $('.btn-print-ok').click(function(){
                                report_stronger_obj.call("write_html_file", [{'html': String($('#ok').find('textarea').val())}]).then(function (res_) {
                                    var dialog1 = new instance.web.Dialog(window, false, '<iframe style="width: 100%; height: 600px" src=' + report_url.replace("html", "pdf") + '/>');
                                    dialog1.open();
                                    instance.web.unblockUI();
                                    return;
                                })
                            });
                        });
                        instance.web.unblockUI();
                    });
                } else if (action.report_type === 'controller') {
                    return trigger_download(self, response, c);
                }
            } else {
                var params = {
                        action: JSON.stringify(action),
                        token: new Date().getTime()
                    };
                var url = self.session.url('/web/report', params);
                if (action.hasOwnProperty("jasper_report")){
                    //window.open(url, 'report', '');
                    var dialog = new instance.web.Dialog(window, false, '<iframe style="width: 100%; height: 600px" src=' + url + '/>');
                    var button = function () {
                        var fn = function () {
                        };
                        var text;
                    }
                    dialog.dialog_options = {
                        destroy_on_close: true,
                        size: 'large', //'medium', 'small'
                        buttons: null,//[btnTest],
                    };
                    dialog.dialog_title ='<a><img src="dynamic_report_odoo8/static/img/excel.png" class="btnExport" data-type="xls"/></a> &nbsp;' + '<a><img src="dynamic_report_odoo8/static/img/doc.png" class="btnExport" data-type="docx"/></a>'
                    dialog.open();
                    var report_name = JSON.parse(params.action).report_name
                    $('.btnExport').click(function () {
                        new instance.web.Model("report.stronger").call("switch_type", [report_name, $(this).data('type')]).then(function(callback){
                            window.open(url, function(){
                                new instance.web.Model("report.stronger").call("switch_type", [report_name, 0]);
                            });
                        });
                    });
                    instance.web.unblockUI();
                    return;
                }else{
                    window.open(url, 'report', '');
                    instance.web.unblockUI();
                    return;
                }
            }
        },
    });
};