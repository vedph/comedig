from glob import glob
from lxml import etree

xml_files = glob('xml/*.xml')

for XML in xml_files:
    tree = etree.parse(XML)
    title = tree.find('{*}teiHeader//{*}title').text
    responsibility = tree.findall('{*}teiHeader//{*}respStmt')
    #print(title)
    #for r in responsibility:
        #print(r.find('{*}resp').text,r.find('{*}name').text)
    publication = tree.find('{*}teiHeader//{*}publicationStmt')
    publisher = publication.find('{*}publisher').text
    date = publication.find('{*}date').text
    licence = publication.find('{*}availability/{*}licence').text
    #print(publisher,date,licence)
    print(len(tree.findall('{*}TEI')))
    

