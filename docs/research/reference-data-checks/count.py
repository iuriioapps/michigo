import sys, zipfile, json
for p in sys.argv[1:]:
    z = zipfile.ZipFile(p)
    n = 0; seqs = set()
    for name in z.namelist():
        if name.startswith("term_bank"):
            for row in json.loads(z.read(name)):
                n += 1; seqs.add(row[6])
    print(p, "rows", n, "entries", len(seqs), "unpacked", sum(i.file_size for i in z.infolist()), "max file", max(i.file_size for i in z.infolist()), "files", len(z.namelist()))
