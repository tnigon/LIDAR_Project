# ----------------------------------------------------------------------------- #
@timeit
def renameRasters(FGDB):
    origdir = arcpy.env.workspace
    arcpy.env.workspace = FGDB

    for rstr in arcpy.ListRasters("G*"):
        try:
            newrstr = "G" + "2014" + rstr.replace("g", "")
            arcpy.Rename_management(rstr, newrstr)

        except:
            print "Failed to rename: " + rstr

    arcpy.env.workspace = origdir
    return None
	
#navigate to directory with many file folders ("LIDAR_data")
dir = "H:\LIDAR_data"
#for every folder in LIDAR_data:
for folder in dir:
	
	#navigate to folder, assign folder name to variable

	#navigate to geodatabase (name is [folder name].gdb
	
	#in geodatabase, rename the one raster file "DEM[folder name]" without any dashes
	
