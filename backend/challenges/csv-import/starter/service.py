from policy import STRICT
def parse_row(line):
    if "\n" in line or "\r" in line: raise ValueError("one record only")
    fields=[]; value=""; quoted=False; closed=False; i=0
    while i<len(line):
        c=line[i]
        if quoted:
            if c=='"':
                if i+1<len(line) and line[i+1]=='"': i+=1
                else: quoted=False; closed=True
            else: value+=c
        elif c==',': fields.append(value); closed=False
        elif closed: raise ValueError("characters after quote")
        elif c=='"':
            if value: raise ValueError("quote inside unquoted field")
            quoted=True
        else: value+=c
        i+=1
    if quoted: raise ValueError("unterminated quote")
    fields.append(value)
    return fields
