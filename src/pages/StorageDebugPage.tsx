import React, { useState, useEffect } from 'react';
import { StorageHealthCheck } from '../lib/storageHealthCheck';
import Layout from '../components/layout/Layout';
import { AlertCircle, CheckCircle, RefreshCw, WrenchIcon } from 'lucide-react';

const StorageDebugPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixes, setFixes] = useState<string[]>([]);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const status = await StorageHealthCheck.checkStorageConfiguration();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoFix = async () => {
    setFixing(true);
    try {
      const appliedFixes = await StorageHealthCheck.fixCommonIssues();
      setFixes(appliedFixes);
      await runHealthCheck(); // Re-run health check
    } catch (error) {
      console.error('Auto-fix failed:', error);
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Storage Configuration Debug</h1>
        
        <div className="space-y-6">
          <div className="flex space-x-4">
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Health Check
                </>
              )}
            </button>
            
            <button
              onClick={autoFix}
              disabled={loading || fixing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center"
            >
              {fixing ? (
                <>
                  <WrenchIcon className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <WrenchIcon className="w-4 h-4 mr-2" />
                  Auto-Fix Issues
                </>
              )}
            </button>
          </div>

          {fixes.length > 0 && (
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-medium mb-2">Applied Fixes:</h3>
              <ul className="list-disc list-inside text-green-300">
                {fixes.map((fix, index) => (
                  <li key={index}>{fix}</li>
                ))}
              </ul>
            </div>
          )}

          {healthStatus && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Storage Health Status</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div className={`p-4 rounded-lg ${healthStatus.bucketExists ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                  <div className="flex items-center">
                    {healthStatus.bucketExists ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    )}
                    <span className="text-white font-medium">Photos Bucket</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">
                    {healthStatus.bucketExists ? 'Bucket exists' : 'Bucket does not exist'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${healthStatus.bucketIsPublic ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                  <div className="flex items-center">
                    {healthStatus.bucketIsPublic ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    )}
                    <span className="text-white font-medium">Public Access</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">
                    {healthStatus.bucketIsPublic ? 'Bucket is public' : 'Bucket is not public'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${healthStatus.transformationsAvailable ? 'bg-green-900/30 border border-green-500/30' : 'bg-yellow-900/30 border border-yellow-500/30'}`}>
                  <div className="flex items-center">
                    {healthStatus.transformationsAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                    )}
                    <span className="text-white font-medium">Image Transformations</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">
                    {healthStatus.transformationsAvailable 
                      ? 'Transformations are available' 
                      : 'Transformations not available (requires Pro plan)'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${healthStatus.sampleUrlAccessible ? 'bg-green-900/30 border border-green-500/30' : 'bg-yellow-900/30 border border-yellow-500/30'}`}>
                  <div className="flex items-center">
                    {healthStatus.sampleUrlAccessible ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                    )}
                    <span className="text-white font-medium">URL Accessibility</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">
                    {healthStatus.sampleUrlAccessible 
                      ? 'Sample photo URL is accessible' 
                      : 'No sample photos or URLs not accessible'}
                  </p>
                </div>
              </div>

              {healthStatus.issues.length > 0 && (
                <div className="p-4 border-t border-gray-700">
                  <h3 className="text-red-400 font-medium mb-2">Issues Found:</h3>
                  <ul className="list-disc list-inside text-red-300 space-y-1">
                    {healthStatus.issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                <h3 className="text-white font-medium mb-2">Recommendations:</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>If transformations aren't available, the app will use original images</li>
                  <li>For best performance, upgrade to Supabase Pro for image transformations</li>
                  <li>Ensure your storage bucket is properly configured with public access</li>
                  <li>Check that RLS policies allow access to the photos bucket</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StorageDebugPage;