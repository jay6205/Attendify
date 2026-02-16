import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar';
import AuthContext from '../context/AuthContext';
import ParentPhoneCaptureModal from '../components/auth/ParentPhoneCaptureModal';

const MainLayout = ({ children }) => {
  const { needsPhoneNumber, clearPhoneRequired } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-16 md:ml-64 transition-all duration-300">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>

      {/* Parent Phone Capture Modal — blocks dashboard until phone is provided */}
      <ParentPhoneCaptureModal
        isOpen={needsPhoneNumber}
        onSuccess={clearPhoneRequired}
      />
    </div>
  );
};

export default MainLayout;

