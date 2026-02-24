import React, { createContext, useContext, useState, useEffect } from 'react';

const EstudioContext = createContext();

export const EstudioProvider = ({ children }) => {
    const [config, setConfig] = useState({
        workTime: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsUntilLongBreak: 4,
        soundEnabled: true
    });

    const [timeLeft, setTimeLeft] = useState(config.workTime * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('WORK'); 
    const [completedSessions, setCompletedSessions] = useState(0); // Total del día
    const [sessionInCycle, setSessionInCycle] = useState(0); // Progreso de las barritas

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            handleNextMode();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleNextMode = () => {
        setIsActive(false);
        if (mode === 'WORK') {
            setCompletedSessions(prev => prev + 1);
            const nextInCycle = sessionInCycle + 1;
            setSessionInCycle(nextInCycle);

            if (nextInCycle >= config.sessionsUntilLongBreak) {
                setMode('LONG');
                setTimeLeft(config.longBreak * 60);
                setSessionInCycle(0); // Reinicia el ciclo visual después del descanso largo
            } else {
                setMode('SHORT');
                setTimeLeft(config.shortBreak * 60);
            }
        } else {
            setMode('WORK');
            setTimeLeft(config.workTime * 60);
        }
    };

    const startTimer = () => {
        if (config.soundEnabled) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(() => {});
        }
        setIsActive(true);
    };

    // CORRECCIÓN: Ahora resetTimer también resetea el modo a Enfoque
    const resetTimer = () => {
        setIsActive(false);
        setMode('WORK');
        setTimeLeft(config.workTime * 60);
    };

    // CORRECCIÓN: Reinicia el progreso visual sin borrar el total del día
    const resetCycles = () => {
        setSessionInCycle(0);
    };

    return (
        <EstudioContext.Provider value={{ 
            timeLeft, isActive, mode, completedSessions, sessionInCycle, config, 
            startTimer, pauseTimer: () => setIsActive(false),
            resetTimer, setMode, setConfig, setTimeLeft, resetCycles
        }}>
            {children}
        </EstudioContext.Provider>
    );
};

export const useEstudio = () => useContext(EstudioContext);