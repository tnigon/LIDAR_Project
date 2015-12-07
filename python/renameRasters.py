# ---------------------------------------------------------------------------- #
# ----- renameRasters.py        ----- #
# ----- Includes: findRasters(), renameRasters(), and projectRaster() ----- #
# ----- Author: Tyler Nigon     ----- #
# ----- Written 11/05/2015      ----- #
# ----- Works successfully with ArcGIS 10.2 and Python 2.7  ----- #

def findRasters(dirFiles, newGDB, uniquePrefix = None):
    """
    findRasters allows you to check which files were successfully copied
    Use: <rootFolders, copiedList = findRasters(dirFiles, newGDB, uniquePrefix)>

    """
    import os, arcpy    #import modules
    from datetime import datetime
    
    #start_time = datetime.now()
    os.chdir(dirFiles)
    root = os.getcwd()
    print "The dir is: %s"%root
    print ""
    rootFolders = []
    copiedList = []    #list of files that were copied to the new geodatabase
    notCopied = []
    notCopiedOriginal = []

    #for every folder in LIDAR_data:
    for name in os.listdir(dirFiles):    #"name" is variable name
        if os.path.isdir(os.path.join(dirFiles, name)): #filters out files in lower level dirs
            if uniquePrefix != None and name.startswith(uniquePrefix) or uniquePrefix == None: #count folders with uniquePrefix OR count all folders; depends if uniquePrefix is set
                newName = "DEM" + name.replace('-', '')#remove dashes from name
                rootFolders.append(newName) #list of folders that should be processed; will compare to list of files that actually got copied
                notCopiedOriginal.append(name) #list of original names           
    arcpy.env.workspace = newGDB   #set env to newGDB, where files should have been copied             
    for raster in arcpy.ListRasters(): #will only rename one raster
        copiedList.append(str(raster)) #converts from unicode to normal string
    print "Total files: %s" % (len(rootFolders))
    print "Total copied: %s" % (len(copiedList))
    notCopied = list(set(rootFolders) - set(copiedList)) #finds difference between lists

    return notCopied, notCopiedOriginal

    #Next, we want to write code to copy only the subset of this list (or do manually)
    

def renameRasters(dirFiles, newGDB, uniquePrefix = None):
    """
    Navigates into a folder directory;
    Renames raster files in ESRI .gdb based on their parent folder name
    Copies renamed files into new .gdb 
    Inputs:
        dirFiles: (string) the location of the file folders to be processed (e.g., "H:\LIDAR_data")
        newGDB: (string) location of geodatabase to copy renamed files (e.g., "H:\LIDAR_data\LIDAR_Rasters.gdb")
        uniquePrefix: (string, optional) identifier to query only folders with this unique prefix (e.g., "4342")
    """
    
    import os, arcpy    #import modules
    from datetime import datetime

    start_time = datetime.now()
    os.chdir(dirFiles)
    root = os.getcwd()
    print "The dir is: %s"%root
    print ""
    n = 0

    #for every folder in LIDAR_data:
    for name in os.listdir(dirFiles):    #"name" is variable name
        if os.path.isdir(os.path.join(dirFiles, name)): #filters out files in lower level dirs
            if uniquePrefix != None and name.startswith(uniquePrefix) or uniquePrefix == None: #count folders with uniquePrefix OR count all folders; depends if uniquePrefix is set
                n += 1  
    rasterNum = n
    n = 1
    
    print "Approximate number of rasters to process: %s  **CAUTION: MAY TAKE OVER 120 SECONDS PER RASTER!**" % (rasterNum)
    print ""
    notRenamedList = [] #keep a list of all file names that didn't get renamed
    renamedList = []   #list of files that were renamed
    copiedList = []    #list of files that were copied to the new geodatabase
    notCopiedList = []
    rasterNamed = False #this is used to decide if file should be saved to GDB
    #arcpy.env.overwriteOutput = True #this can be used to overwrite existing file

    #for every folder in LIDAR_data:
    for name in os.listdir(dirFiles):    #"name" is variable name
        if os.path.isdir(os.path.join(dirFiles, name)): #filters out files in lower level dirs
            if uniquePrefix != None and name.startswith(uniquePrefix) or uniquePrefix == None: #count all but those that do not start withuniquePrefix (if uniquePrefixe is not "None")
                print "Renaming %s of %s. Correctly renamed: %s of %s. Correctly copied: %s of %s" % (n, rasterNum, (len(renamedList)), n-1, (len(copiedList)), n-1)
                #print os.path.abspath(name)
                dirName = os.path.abspath(name) #save absolute path to variable
                #print dirName
                
                gdbDir = os.path.join(dirName, '',name + ".gdb") #navigate to geodatabase (name is [folder name].gdb
                #print gdbDir
                arcpy.env.workspace = gdbDir   #set env to current .gdb             
                for raster in arcpy.ListRasters(): #will only rename one raster
                    #print raster
                    try:                      
                        newRaster = "DEM" + name.replace('-', '')#remove dashes from name
                        if raster != newRaster:
                            print "Going to try to rename %s to %s" % (raster, newRaster)
                            arcpy.Rename_management(raster, newRaster) #actually renames the raster
                            print "Successfully renamed! %s -> %s" % (raster, newRaster)
                            rasterNamed = True
                        elif raster == newRaster: #raster is already correclty renamed
                            rasterNamed = True
                            print "%s is already correctly named. Moving on.." % (raster)
                        renamedList.append(newRaster)
                    except:
                        print "Failed to rename: " + raster
                        notRenamedList = notRenamedList.append(newRaster)
                    if rasterNamed == True: #if the correct name was assigned
                        try:
                            ##Copy File RasterDataset to GDB Dataset
                            out_rasterdataset = os.path.join(newGDB, '', newRaster)
                            arcpy.CopyRaster_management(newRaster, out_rasterdataset, "","","","","","")
                            copiedList.append(newRaster)
                            print "Successfully copied %s to: %s" % (newRaster, out_rasterdataset)
                        except:
                            print "***Failed to copy %s" % (newRaster)
                            print arcpy.GetMessages()
                            #add in: if arcpy.GetMessages() == file already exists: then copiedList.append(newRaster), else:
                            notCopiedList.append(newRaster) 
                    else: #raster name is not correct and we shouldn't copy to new .gdb
                        notCopiedList.append(newRaster) #if not copied, add to list.
                n += 1
                rasterNamed = False
                end_time = datetime.now()
                print "Elapsed time: {}".format(end_time - start_time)
                print ""
    return renamedList, notRenamedList, copiedList, notCopiedList #return lists of successful and unsuccessful files


def projectRaster(rootGDB, newGDB, outCRS = 4326):
    """
    Projects raster to new coordinate system
    Inputs:
        rootGDB: (string) geodatabase where rasters reside originally (e.g., "H:\LIDAR_data\LIDAR_Rasters.gdb")
        newGDB: (string) geodatabase to save projected rasters (e.g., "H:\LIDAR_data\Dakota_LIDAR_Rasters.gdb")
        outCRS: (integer or string) output coordinate reference system as EPSG
            number (use integer), or as name of the CRS (use string).
            Examples: 4326 [as integer] or "WGS 1984" [as string]
            -> default is 4326 for WGS 84) 
    """
    print ""
    import os, arcpy    #import modules
    from datetime import datetime

    start_time = datetime.now()
    n = 1   #number of rasters in gdb
    n2 = 0    #number of rasters attempted to reproject
    rasterList = []
    projectedList = []
    notProjectedList = []
    arcpy.env.workspace = rootGDB   #set env to current .gdb
    
    # by using its factory code 26911 (available in *.prj file)
    outCS = arcpy.SpatialReference(outCRS)
    outCS.factoryCode = outCRS
    #outCS.create() #outCS should be the .prj file
    #arcpy.env.outputCoordinateSystem = arcpy.SpatialReference("WGS 1984 UTM Zone 18N")
    print "Will reprojecte to: %s" % (str(outCS.name))
    print ""
    
    rasterList = arcpy.ListRasters()
    print "Number of rasters: %s" % (len(rasterList))
    print ""

    for raster in rasterList:
        print "Reprojecting %s of %s. Correctly reprojected: %s of %s" % (n, len(rasterList), (len(projectedList)), n2)
        dsc = arcpy.Describe(raster)    #get information about the raster
        inCS = dsc.spatialReference    #get the spatial reference of raster
        if dsc.spatialReference.Name == "Unknown":   # Determine if the input has a defined coordinate system, can't project if it does not
            print "Undefined CRS; can't reproject: %s" % (raster)
        elif dsc.spatialReference.Name == outCRS or dsc.spatialReference.factoryCode == outCRS:
            print "Input CRS (%s) and output CRS (%s) are the same. Skipping: %s" % (str(inCS.name), str(outCS.name), raster)
        else:
            n2 += 1
            try:
                newRasterName = raster + "_WGS84" #get new name for raster
                newRasterDir = os.path.join(newGDB, '',newRasterName)
                ##Reproject a TIFF image with Datumn transfer
                arcpy.ProjectRaster_management(raster, newRasterDir, outCS.factoryCode,\
                    "NEAREST", "", "NAD_1983_To_WGS_1984_5", "", inCS.factoryCode)    #can use factory code as in and out CRS    #find out if I can dynamically determine the "NAD_1983_To_WGS_1984_5" part
                projectedList.append(newRasterName)
                print "Successfully projected from %s to %s: %s" % (str(inCS.name), str(outCS.name), raster)
            except:
                print "Project Raster example failed."
                print arcpy.GetMessages()
                notProjectedList.append(raster)
        n += 1
        end_time = datetime.now()
        print "Elapsed time: {}".format(end_time - start_time)
        print ""
    return projectedList, notProjectedList
    print "Total files: %s" % (len(rasterList))
    print "Total reprojected: %s" % (len(projectedList))
    print "Total failed to reproject: %s" % (len(notProjectedList))

        