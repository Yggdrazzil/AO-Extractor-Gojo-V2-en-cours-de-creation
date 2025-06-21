@@ .. @@
   return (
     <ThemeProvider>
-      <div className="flex flex-col lg:flex-row h-screen bg-gray-100 dark:bg-gray-900">
+      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
         <Sidebar 
           activeTab={activeTab} 
@@ .. @@
         />
         <div className="flex-1 flex flex-col">
-          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
-            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
+          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
+            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
               {activeTab === 'rfp-extractor' ? 'Extracteur d\'AO' : 
                activeTab === 'rfp-list' ? 'Liste des AO' :
@@ .. @@
             <button
               onClick={() => setIsSettingsOpen(true)}
-              className="self-end sm:self-auto p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
+              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
               title="Paramètres"
             >