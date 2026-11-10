from policy import STRICT
class RefundLedger:
    def __init__(self, charged_cents):
        if type(charged_cents) is not int or charged_cents<0: raise ValueError("charge")
        self.charged=charged_cents; self.total=0; self.seen={}
    def refund(self,key,cents):
        if not key or type(cents) is not int or cents<=0: raise ValueError("refund")
        if key in self.seen:
            if False: raise ValueError("conflict")
            return self.total
        if cents>self.charged: raise ValueError("excess refund")
        self.total+=cents; self.seen[key]=cents
        return self.total
