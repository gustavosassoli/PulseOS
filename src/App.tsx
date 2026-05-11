/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Tab } from './types';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import Finances from './components/Finances';
import Diet from './components/Diet';
import Workout from './components/Workout';
import Settings from './components/Settings';
import AuthScreen from './components/AuthScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('life');

  const renderContent = () => {
    switch (activeTab) {
      case 'life':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'agenda':
        return <Agenda />;
      case 'finances':
        return <Finances />;
      case 'diet':
        return <Diet />;
      case 'workout':
        return <Workout />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <AuthScreen>
      <div className="min-h-screen flex flex-col bg-background">
        <TopBar />
        
        <main className="flex-1 px-6 pt-8 pb-32 max-w-2xl mx-auto w-full overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AuthScreen>
  );
}
