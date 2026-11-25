# Strong’s dictionaries

James Strong, 1890. Public domain. CrossWire Greek 2.0 and Hebrew 1.2.

Greek TEI is flattened to inert text with lexical form and transliteration retained. Hebrew entries retain the source transliteration and pronunciation in their complete text; no Hebrew script is invented. Numeric gaps in the source are preserved. No active source HTML is rendered.

Source: https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=StrongsGreek

```ini
## Sword module configuration file

## Required elements
# Module Unique Identifier.
[StrongsGreek]

# Short description of the module.
Description=Strong's Greek Bible Dictionary

# Path to the module data files relative to the SWORD module library root directory.
DataPath=./modules/lexdict/zld/strongsgreek/dict

# Driver used for reading the module.
ModDrv=zLD

## Required elements with defaults
# Markup used in the module.
SourceType=TEI

# How the text in the conf and in the module are encoded.
Encoding=UTF-8

# Compression algorithm.
CompressType=ZIP

# Module features.
Feature=GreekDef

## General informatic and installer elements
# A lengthier description.
About=Strong's Bible Dictionary\par\par Dictionaries of Hebrew and Greek Words taken from Strong's Exhaustive Concordance by James Strong, S.T.D., LL.D. 1890.

# Module's revision.
Version=2.0

# Indicates what has changed between different versions.
History_1.1=now contains Strong's Lexicon instead of Thayer's
History_1.2=Added Feature 'GreekDef' to configuration.
History_2.0=(2023-11-23) Switched to TEI using lexicon template with standard elements for each entry including Greek lexical form, transliteration and pronunciation.

# The minimum version of the SWORD library required for this module.
MinimumVersion=1.5.11

# Library of Congress Subject Heading.
LCSH=Greek language--Dictionaries--English.

# Language code of the module.
Lang=en

## Copyright and Licensing related elements
DistributionLicense=Public Domain
TextSource=http://www.bf.org/

# Total byte size of the module on disk.
InstallSize=863426

```

Source: https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=StrongsHebrew

```ini
[StrongsHebrew]
DataPath=./modules/lexdict/rawld/strongshebrew/strongshebrew
ModDrv=RawLD
Lang=en
Feature=HebrewDef
Version=1.2
History_1.2=Added Feature 'HebrewDef' to configuration.
History_1.1=now contains Strong's Lexicon instead of BDB
Description=Strong's Hebrew Bible Dictionary
About=Strong's Bible Dictionary\par\par Dictionaries of Hebrew and Greek Words taken from Strong's Exhaustive Concordance by James Strong, S.T.D., LL.D. 1890\par Public Domain -- Copy Freely\par see STRONGS.DOC for more information
TextSource=http://www.bf.org/
LCSH=Hebrew language--Dictionaries--English.
DistributionLicense=Public Domain
SwordVersionDate=2002-01-01
InstallSize=1552838

```