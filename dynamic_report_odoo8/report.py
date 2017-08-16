from openerp.osv import osv
from openerp import fields, api, models
import os
import openerp


class Report(osv.Model):
    _inherit = "report"

    @api.v7
    def get_pdf(self, cr, uid, ids, report_name, html=None, data=None, context=None):
        html = open('%s/%s' % (os.path.dirname(__file__), 'controllers/report.html'), 'r+').read()
        res = super(Report, self).get_pdf(cr, uid, ids, report_name, html=html, data=data, context=context)
        return res

Report()


class ReportStronger(models.Model):
    _name = "report.stronger"

    @api.model
    def switch_type(self, report_name, report_type):
        openerp.report.interface.report_int._reports["report."+report_name].report_output = report_type
        return report_type

    @api.model
    def get_html(self, report_id, report_name, model_name):
        res = self.env['report'].get_html(self.env[model_name].browse(report_id), report_name)
        return res

    @api.model
    def write_html_file(self, vals):
        f = open('%s/%s' % (os.path.dirname(__file__), 'controllers/report.html'), 'r+')
        f.seek(0)
        f.truncate()
        f.write(vals['html'].encode('ascii', 'xmlcharrefreplace'))
        f.close()
        res = super(ReportStronger, self).write(vals)
        return res

ReportStronger()
