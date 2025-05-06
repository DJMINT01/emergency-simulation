import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const EmergencyComparisonSimulation = () => {
  const [scenario, setScenario] = useState('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialTasksData, setInitialTasksData] = useState([]);
  const [totalInitialVictims, setTotalInitialVictims] = useState(0);
  
  // 两个独立的模拟
  const [nearestSimulation, setNearestSimulation] = useState({
    tasks: [],
    rescuerPosition: { x: 50, y: 50 },
    rescuerState: 'IDLE',
    currentTaskId: null,
    rescued: 0,
    results: null
  });
  
  const [largestSimulation, setLargestSimulation] = useState({
    tasks: [],
    rescuerPosition: { x: 50, y: 50 },
    rescuerState: 'IDLE',
    currentTaskId: null,
    rescued: 0,
    results: null
  });
  
  // 样式定义
  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    gridMd: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    card: {
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    select: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      color: 'white',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer'
    },
    buttonBlue: {
      backgroundColor: '#3b82f6'
    },
    buttonGray: {
      backgroundColor: '#6b7280'
    },
    mapContainer: {
      position: 'relative',
      background: '#f3f4f6',
      border: '2px solid #d1d5db',
      borderRadius: '8px',
      height: '400px',
      marginBottom: '16px'
    },
    circle: {
      position: 'absolute',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)'
    },
    rescuerCenter: {
      width: '16px',
      height: '16px',
      background: '#dc2626',
      zIndex: 2
    },
    taskCircle: {
      width: '24px',
      height: '24px',
      border: '2px solid black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    taskOrange: {
      background: '#f97316'
    },
    taskGray: {
      background: '#9ca3af'
    },
    rescuerTeam: {
      width: '24px',
      height: '24px',
      background: '#2563eb',
      border: '2px solid white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: 'white'
    },
    legendList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      fontSize: '14px'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px'
    },
    mapLabel: {
      padding: '8px 16px',
      background: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: 10,
      fontWeight: 'bold'
    },
    progressBar: {
      width: '100%',
      height: '20px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      marginTop: '8px',
      marginBottom: '16px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#3b82f6',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    }
  };
  
  // 初始化场景
  useEffect(() => {
    initializeScenario();
  }, [scenario]);
  
  const initializeScenario = () => {
    const taskCounts = {
      'small': 10,
      'medium': 25, 
      'large': 50
    };
    
    const numTasks = taskCounts[scenario];
    const newTasks = [];
    let initialVictims = 0;
    
    // 创建确定性随机数来保证两个模拟使用相同的任务
    let seedValue = 12345 + scenario.length;
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
    
    for (let i = 0; i < numTasks; i++) {
      const position = {
        x: random() * 80 + 10,
        y: random() * 80 + 10
      };
      const distance = Math.sqrt(Math.pow(position.x - 50, 2) + Math.pow(position.y - 50, 2));
      const reportTime = distance / 5;
      const victims = Math.floor(random() * 450) + 50;
      
      newTasks.push({
        id: i,
        ...position,
        initialVictims: victims,
        currentVictims: victims,
        declineRate: 0.15,
        reported: false,
        reportTime: reportTime
      });
      
      initialVictims += victims;
    }
    
    // 保存初始任务数据
    setInitialTasksData(newTasks);
    setTotalInitialVictims(initialVictims);
    
    // 重置两个模拟
    setNearestSimulation({
      tasks: JSON.parse(JSON.stringify(newTasks)),
      rescuerPosition: { x: 50, y: 50 },
      rescuerState: 'IDLE',
      currentTaskId: null,
      rescued: 0,
      results: null
    });
    
    setLargestSimulation({
      tasks: JSON.parse(JSON.stringify(newTasks)),
      rescuerPosition: { x: 50, y: 50 },
      rescuerState: 'IDLE',
      currentTaskId: null,
      rescued: 0,
      results: null
    });
    
    setCurrentTime(0);
    setIsPlaying(false);
  };
  
  const updateSimulation = () => {
    // 更新时间
    setCurrentTime(prev => prev + 0.1);
    
    // 更新最近任务优先模拟
    setNearestSimulation(prev => {
      const updatedSimulation = { ...prev };
      
      // 更新任务状态
      updatedSimulation.tasks = prev.tasks.map(task => {
        let updated = { ...task };
        
        // 报告逻辑
        if (!updated.reported && currentTime >= updated.reportTime) {
          updated.reported = true;
        }
        
        // 人数下降逻辑
        if (updated.reported && updated.currentVictims > 0) {
          const decline = updated.initialVictims * updated.declineRate * 0.1 / 60;
          updated.currentVictims = Math.max(0, updated.currentVictims - decline);
        }
        
        return updated;
      });
      
      // 更新救援人员
      switch (updatedSimulation.rescuerState) {
        case 'IDLE':
          // 空闲状态，寻找新任务
          const availableTasks = updatedSimulation.tasks.filter(task => 
            task.reported && task.currentVictims > 0
          );
          
          if (availableTasks.length > 0) {
            // 最近任务优先
            const selectedTask = availableTasks.reduce((closest, task) => {
              const distToCurrent = getDistance(updatedSimulation.rescuerPosition, task);
              const distToClosest = getDistance(updatedSimulation.rescuerPosition, closest);
              return distToCurrent < distToClosest ? task : closest;
            });
            
            updatedSimulation.currentTaskId = selectedTask.id;
            updatedSimulation.rescuerState = 'MOVING_TO_TASK';
          }
          break;
          
        case 'MOVING_TO_TASK':
          // 移动到任务点
          if (updatedSimulation.currentTaskId !== null) {
            const task = updatedSimulation.tasks.find(t => t.id === updatedSimulation.currentTaskId);
            if (task) {
              const distance = getDistance(updatedSimulation.rescuerPosition, task);
              
              if (distance < 1) {
                // 到达目标位置
                updatedSimulation.rescuerPosition = { x: task.x, y: task.y };
                updatedSimulation.rescuerState = 'AT_TASK';
              } else {
                // 继续移动
                const moveSpeed = 1;
                const dx = task.x - updatedSimulation.rescuerPosition.x;
                const dy = task.y - updatedSimulation.rescuerPosition.y;
                
                updatedSimulation.rescuerPosition = {
                  x: updatedSimulation.rescuerPosition.x + (dx / distance) * moveSpeed,
                  y: updatedSimulation.rescuerPosition.y + (dy / distance) * moveSpeed
                };
              }
            }
          }
          break;
          
        case 'AT_TASK':
          // 执行救援
          if (updatedSimulation.currentTaskId !== null) {
            const taskIndex = updatedSimulation.tasks.findIndex(t => t.id === updatedSimulation.currentTaskId);
            if (taskIndex !== -1) {
              const task = updatedSimulation.tasks[taskIndex];
              
              if (task.currentVictims <= 0) {
                // 任务完成
                updatedSimulation.currentTaskId = null;
                updatedSimulation.rescuerState = 'IDLE';
              } else {
                // 执行救援
                const maxPossibleRescue = Math.min(task.currentVictims, 30);
                const actualRescued = Math.min(maxPossibleRescue, totalInitialVictims - updatedSimulation.rescued);
                
                if (actualRescued > 0) {
                  updatedSimulation.rescued = Math.min(updatedSimulation.rescued + actualRescued, totalInitialVictims);
                  // 更新任务
                  updatedSimulation.tasks = [...updatedSimulation.tasks];
                  updatedSimulation.tasks[taskIndex] = {
                    ...task,
                    currentVictims: Math.max(0, task.currentVictims - actualRescued)
                  };
                }
              }
            }
          }
          break;
      }
      
      return updatedSimulation;
    });
    
    // 更新最大任务优先模拟
    setLargestSimulation(prev => {
      const updatedSimulation = { ...prev };
      
      // 更新任务状态
      updatedSimulation.tasks = prev.tasks.map(task => {
        let updated = { ...task };
        
        // 报告逻辑
        if (!updated.reported && currentTime >= updated.reportTime) {
          updated.reported = true;
        }
        
        // 人数下降逻辑
        if (updated.reported && updated.currentVictims > 0) {
          const decline = updated.initialVictims * updated.declineRate * 0.1 / 60;
          updated.currentVictims = Math.max(0, updated.currentVictims - decline);
        }
        
        return updated;
      });
      
      // 更新救援人员
      switch (updatedSimulation.rescuerState) {
        case 'IDLE':
          // 空闲状态，寻找新任务
          const availableTasks = updatedSimulation.tasks.filter(task => 
            task.reported && task.currentVictims > 0
          );
          
          if (availableTasks.length > 0) {
            // 最大任务优先
            const selectedTask = availableTasks.reduce((largest, task) => {
              return task.currentVictims > largest.currentVictims ? task : largest;
            });
            
            updatedSimulation.currentTaskId = selectedTask.id;
            updatedSimulation.rescuerState = 'MOVING_TO_TASK';
          }
          break;
          
        case 'MOVING_TO_TASK':
          // 移动到任务点
          if (updatedSimulation.currentTaskId !== null) {
            const task = updatedSimulation.tasks.find(t => t.id === updatedSimulation.currentTaskId);
            if (task) {
              const distance = getDistance(updatedSimulation.rescuerPosition, task);
              
              if (distance < 1) {
                // 到达目标位置
                updatedSimulation.rescuerPosition = { x: task.x, y: task.y };
                updatedSimulation.rescuerState = 'AT_TASK';
              } else {
                // 继续移动
                const moveSpeed = 1;
                const dx = task.x - updatedSimulation.rescuerPosition.x;
                const dy = task.y - updatedSimulation.rescuerPosition.y;
                
                updatedSimulation.rescuerPosition = {
                  x: updatedSimulation.rescuerPosition.x + (dx / distance) * moveSpeed,
                  y: updatedSimulation.rescuerPosition.y + (dy / distance) * moveSpeed
                };
              }
            }
          }
          break;
          
        case 'AT_TASK':
          // 执行救援
          if (updatedSimulation.currentTaskId !== null) {
            const taskIndex = updatedSimulation.tasks.findIndex(t => t.id === updatedSimulation.currentTaskId);
            if (taskIndex !== -1) {
              const task = updatedSimulation.tasks[taskIndex];
              
              if (task.currentVictims <= 0) {
                // 任务完成
                updatedSimulation.currentTaskId = null;
                updatedSimulation.rescuerState = 'IDLE';
              } else {
                // 执行救援
                const maxPossibleRescue = Math.min(task.currentVictims, 30);
                const actualRescued = Math.min(maxPossibleRescue, totalInitialVictims - updatedSimulation.rescued);
                
                if (actualRescued > 0) {
                  updatedSimulation.rescued = Math.min(updatedSimulation.rescued + actualRescued, totalInitialVictims);
                  // 更新任务
                  updatedSimulation.tasks = [...updatedSimulation.tasks];
                  updatedSimulation.tasks[taskIndex] = {
                    ...task,
                    currentVictims: Math.max(0, task.currentVictims - actualRescued)
                  };
                }
              }
            }
          }
          break;
      }
      
      return updatedSimulation;
    });
  };
  
  const getDistance = (pos1, pos2) => {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + 
      Math.pow(pos1.y - pos2.y, 2)
    );
  };
  
  // 模拟循环
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        updateSimulation();
        
        // 检查结束条件
        const nearestCompleted = nearestSimulation.tasks.every(task => task.currentVictims <= 0);
        const largestCompleted = largestSimulation.tasks.every(task => task.currentVictims <= 0);
        const timeExceeded = currentTime >= 300;
        
        if ((nearestCompleted && largestCompleted) || timeExceeded) {
          setIsPlaying(false);
          
          setNearestSimulation(prev => ({
            ...prev,
            results: {
              successRate: prev.rescued / totalInitialVictims,
              time: currentTime
            }
          }));
          
          setLargestSimulation(prev => ({
            ...prev,
            results: {
              successRate: prev.rescued / totalInitialVictims,
              time: currentTime
            }
          }));
        }
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, nearestSimulation, largestSimulation, totalInitialVictims]);
  
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const EmergencySimulation = () => {
  const [scenario, setScenario] = useState('medium');
  const [strategy, setStrategy] = useState('nearest');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [rescuerPosition, setRescuerPosition] = useState({ x: 50, y: 50 });
  const [rescuerState, setRescuerState] = useState('IDLE');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [results, setResults] = useState(null);
  const [totalInitialVictims, setTotalInitialVictims] = useState(0);
  const [totalRescued, setTotalRescued] = useState(0);
  
  // 样式定义
  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    gridMd: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    card: {
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    select: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      color: 'white',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer'
    },
    buttonBlue: {
      backgroundColor: '#3b82f6'
    },
    buttonGray: {
      backgroundColor: '#6b7280'
    },
    mapContainer: {
      position: 'relative',
      background: '#f3f4f6',
      border: '2px solid #d1d5db',
      borderRadius: '8px',
      height: '500px'
    },
    circle: {
      position: 'absolute',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)'
    },
    rescuerCenter: {
      width: '16px',
      height: '16px',
      background: '#dc2626',
      zIndex: 2
    },
    taskCircle: {
      width: '24px',
      height: '24px',
      border: '2px solid black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    taskOrange: {
      background: '#f97316'
    },
    taskGray: {
      background: '#9ca3af'
    },
    rescuerTeam: {
      width: '24px',
      height: '24px',
      background: '#2563eb',
      border: '2px solid white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: 'white'
    },
    legendList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      fontSize: '14px'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px'
    }
  };
  
  // 初始化场景
  useEffect(() => {
    initializeScenario();
  }, [scenario]);
  
  const initializeScenario = () => {
    const taskCounts = {
      'small': 10,
      'medium': 25, 
      'large': 50
    };
    
    const numTasks = taskCounts[scenario];
    const newTasks = [];
    let initialVictims = 0;
    
    for (let i = 0; i < numTasks; i++) {
      const position = {
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      };
      const distance = Math.sqrt(Math.pow(position.x - 50, 2) + Math.pow(position.y - 50, 2));
      const reportTime = distance / 5;
      const victims = Math.floor(Math.random() * 450) + 50;
      
      newTasks.push({
        id: i,
        ...position,
        initialVictims: victims,
        currentVictims: victims,
        declineRate: 0.15,
        reported: false,
        reportTime: reportTime
      });
      
      initialVictims += victims;
    }
    
    setTasks(newTasks);
    setRescuerPosition({ x: 50, y: 50 });
    setRescuerState('IDLE');
    setCurrentTaskId(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setResults(null);
    setTotalInitialVictims(initialVictims);
    setTotalRescued(0);
  };
  
  const updateSimulation = () => {
    setCurrentTime(prev => prev + 0.1);
    
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        let updated = { ...task };
        
        if (!updated.reported && currentTime >= updated.reportTime) {
          updated.reported = true;
        }
        
        if (updated.reported && updated.currentVictims > 0) {
          const decline = updated.initialVictims * updated.declineRate * 0.1 / 60;
          updated.currentVictims = Math.max(0, updated.currentVictims - decline);
        }
        
        return updated;
      });
    });
    
    switch (rescuerState) {
      case 'IDLE':
        findAndAssignTask();
        break;
      case 'MOVING_TO_TASK':
        moveToCurrentTask();
        break;
      case 'AT_TASK':
        performRescue();
        break;
      default:
        break;
    }
  };
  
  const findAndAssignTask = () => {
    const availableTasks = tasks.filter(task => 
      task.reported && 
      task.currentVictims > 0
    );
    
    if (availableTasks.length === 0) return;
    
    let selectedTask;
    
    if (strategy === 'nearest') {
      selectedTask = availableTasks.reduce((closest, task) => {
        const distToCurrent = getDistance(rescuerPosition, task);
        const distToClosest = getDistance(rescuerPosition, closest);
        return distToCurrent < distToClosest ? task : closest;
      });
    } else {
      selectedTask = availableTasks.reduce((largest, task) => {
        return task.currentVictims > largest.currentVictims ? task : largest;
      });
    }
    
    setCurrentTaskId(selectedTask.id);
    setRescuerState('MOVING_TO_TASK');
  };
  
  const moveToCurrentTask = () => {
    if (currentTaskId === null) return;
    
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    
    const distance = getDistance(rescuerPosition, task);
    
    if (distance < 1) {
      setRescuerPosition({ x: task.x, y: task.y });
      setRescuerState('AT_TASK');
    } else {
      const moveSpeed = 1;
      const dx = task.x - rescuerPosition.x;
      const dy = task.y - rescuerPosition.y;
      
      setRescuerPosition({
        x: rescuerPosition.x + (dx / distance) * moveSpeed,
        y: rescuerPosition.y + (dy / distance) * moveSpeed
      });
    }
  };
  
  const performRescue = () => {
    if (currentTaskId === null) return;
    
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task || task.currentVictims <= 0) {
      setCurrentTaskId(null);
      setRescuerState('IDLE');
      return;
    }
    
    setTasks(prevTasks => {
      return prevTasks.map(t => {
        if (t.id === currentTaskId) {
          const rescued = Math.min(t.currentVictims, 30);
          setTotalRescued(prev => prev + rescued);
          
          return {
            ...t,
            currentVictims: Math.max(0, t.currentVictims - rescued)
          };
        }
        return t;
      });
    });
  };
  
  const getDistance = (pos1, pos2) => {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + 
      Math.pow(pos1.y - pos2.y, 2)
    );
  };
  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        updateSimulation();
        
        const allTasksDone = tasks.every(task => task.currentVictims === 0);
        const timeExceeded = currentTime >= 300;
        
        if (allTasksDone || timeExceeded) {
          setIsPlaying(false);
          setResults({
            successRate: totalRescued / totalInitialVictims,
            time: currentTime,
            totalVictims: totalInitialVictims,
            rescuedVictims: totalRescued
          });
        }
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, tasks, rescuerPosition, rescuerState, currentTaskId, strategy, totalInitialVictims, totalRescued]);
  
  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>城市应急模拟系统 - 算法对比</h1>
      
      <div style={styles.gridMd}>
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>场景选择</h3>
          <select 
            value={scenario} 
            onChange={(e) => setScenario(e.target.value)}
            style={styles.select}
          >
            <option value="small">小型 (10个任务)</option>
            <option value="medium">中型 (25个任务)</option>
            <option value="large">大型 (50个任务)</option>
          </select>
        </div>
        
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>控制</h3>
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{...styles.button, ...styles.buttonBlue}}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button 
              onClick={initializeScenario}
              style={{...styles.button, ...styles.buttonGray}}
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
        
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>状态</h3>
          <p>时间: {currentTime.toFixed(1)} 分钟</p>
          <p>灾情点: {initialTasksData.length}</p>
          <p>救援人员: 每算法15名</p>
          <p>总受灾人数: {Math.round(totalInitialVictims)}</p>
        </div>
      </div>
      
      {/* 最近任务优先地图 */}
      <div style={{...styles.mapContainer, borderColor: '#3b82f6'}}>
        <div style={styles.mapLabel}>最近任务优先</div>
        
        {/* 救援进度条 */}
        <div style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          width: '200px',
          zIndex: 10
        }}>
          <div>救援进度: {(Math.min(nearestSimulation.rescued / totalInitialVictims, 1) * 100).toFixed(1)}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min(nearestSimulation.rescued / totalInitialVictims, 1) * 100}%`
              }}
            />
          </div>
        </div>
        
        {/* 救援中心 */}
        <div 
          style={{
            ...styles.circle,
            ...styles.rescuerCenter,
            left: '50%',
            top: '50%'
          }}
        />
        
        {/* 灾情点 */}
        {nearestSimulation.tasks.map(task => (
          <div
            key={task.id}
            style={{
              ...styles.circle,
              ...styles.taskCircle,
              ...(task.reported ? styles.taskOrange : styles.taskGray),
              left: `${task.x}%`,
              top: `${task.y}%`,
              opacity: task.currentVictims > 0 ? 1 : 0.3,
              border: task.id === nearestSimulation.currentTaskId ? '3px solid green' : '2px solid black'
            }}
          >
            {Math.round(task.currentVictims)}
          </div>
        ))}
        
        {/* 救援队伍 */}
        <div
          style={{
            ...styles.circle,
            ...styles.rescuerTeam,
            left: `${nearestSimulation.rescuerPosition.x}%`,
            top: `${nearestSimulation.rescuerPosition.y}%`
          }}
        >
          15
        </div>
      </div>
      
      {/* 最大任务优先地图 */}
      <div style={{...styles.mapContainer, borderColor: '#ef4444'}}>
        <div style={styles.mapLabel}>最大任务优先</div>
        
        {/* 救援进度条 */}
        <div style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          width: '200px',
          zIndex: 10
        }}>
          <div>救援进度: {(Math.min(largestSimulation.rescued / totalInitialVictims, 1) * 100).toFixed(1)}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min(largestSimulation.rescued / totalInitialVictims, 1) * 100}%`,
                backgroundColor: '#ef4444'
              }}
            />
          </div>
        </div>
        
        {/* 救援中心 */}
        <div 
          style={{
            ...styles.circle,
            ...styles.rescuerCenter,
            left: '50%',
            top: '50%'
          }}
        />
        
        {/* 灾情点 */}
        {largestSimulation.tasks.map(task => (
          <div
            key={task.id}
            style={{
              ...styles.circle,
              ...styles.taskCircle,
              ...(task.reported ? styles.taskOrange : styles.taskGray),
              left: `${task.x}%`,
              top: `${task.y}%`,
              opacity: task.currentVictims > 0 ? 1 : 0.3,
              border: task.id === largestSimulation.currentTaskId ? '3px solid green' : '2px solid black'
            }}
          >
            {Math.round(task.currentVictims)}
          </div>
        ))}
        
        {/* 救援队伍 */}
        <div
          style={{
            ...styles.circle,
            ...styles.rescuerTeam,
            left: `${largestSimulation.rescuerPosition.x}%`,
            top: `${largestSimulation.rescuerPosition.y}%`,
            backgroundColor: '#ef4444'
          }}
        >
          15
        </div>
      </div>
      
      {/* 对比结果 */}
      {(nearestSimulation.results || largestSimulation.results) && (
        <div style={{...styles.card, marginTop: '16px'}}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>模拟结果对比</h3>
          <div style={{display: 'flex', gap: '16px'}}>
            <div style={{flex: 1}}>
              <h4 style={{fontWeight: 'bold', color: '#3b82f6'}}>最近任务优先</h4>
              <ul style={styles.legendList}>
                <li>成功率: {nearestSimulation.results ? (nearestSimulation.results.successRate * 100).toFixed(1) : 0}%</li>
                <li>完成时间: {nearestSimulation.results ? nearestSimulation.results.time.toFixed(1) : 0} 分钟</li>
                <li>救援人数: {Math.round(nearestSimulation.rescued)}</li>
              </ul>
            </div>
            <div style={{flex: 1}}>
              <h4 style={{fontWeight: 'bold', color: '#ef4444'}}>最大任务优先</h4>
              <ul style={styles.legendList}>
                <li>成功率: {largestSimulation.results ? (largestSimulation.results.successRate * 100).toFixed(1) : 0}%</li>
                <li>完成时间: {largestSimulation.results ? largestSimulation.results.time.toFixed(1) : 0} 分钟</li>
                <li>救援人数: {Math.round(largestSimulation.rescued)}</li>
              </ul>
            </div>
          </div>
          <div style={{marginTop: '16px'}}>
            <h4 style={{fontWeight: 'bold'}}>胜出策略:</h4>
            {nearestSimulation.results && largestSimulation.results && (
              <p style={{fontSize: '16px', fontWeight: 'bold'}}>
                {nearestSimulation.results.successRate > largestSimulation.results.successRate 
                  ? "最近任务优先 (更高的救援成功率)" 
                  : nearestSimulation.results.successRate < largestSimulation.results.successRate
                    ? "最大任务优先 (更高的救援成功率)"
                    : "平局 (救援成功率相同)"}
              </p>
            )}
          </div>
        </div>
      )}
      
      <div style={{...styles.card, marginTop: '16px'}}>
        <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>图例说明</h3>
        <ul style={styles.legendList}>
          <li style={styles.legendItem}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#dc2626',
              borderRadius: '50%'
            }}/>
            <span>救援中心</span>
          </li>
          <li style={styles.legendItem}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#f97316',
              borderRadius: '50%'
            }}/>
            <span>已报告灾情点</span>
          </li>
          <li style={styles.legendItem}>
            <div style={{
              width: '16px',
              height: '16px',
              background: '#9ca3af',
              borderRadius: '50%'
            }}/>
            <span>未报告灾情点</span>
          </li>
          <li style={styles.legendItem}>
            <div style={{
              width: '24px',
              height: '24px',
              background: '#2563eb',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              15
            </div>
            <span>最近任务优先救援队伍</span>
          </li>
          <li style={styles.legendItem}>
            <div style={{
              width: '24px',
              height: '24px',
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              15
            </div>
            <span>最大任务优先救援队伍</span>
          </li>
          <li style={styles.legendItem}>
            <div style={{
              width: '24px',
              height: '24px',
              background: '#f97316',
              borderRadius: '50%',
              border: '3px solid green',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              100
            </div>
            <span>当前正在执行的任务</span>
          </li>
        </ul>
      </div>
    <div style={styles.container}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>城市应急模拟系统</h1>
      
      <div style={styles.gridMd}>
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>场景选择</h3>
          <select 
            value={scenario} 
            onChange={(e) => setScenario(e.target.value)}
            style={styles.select}
          >
            <option value="small">小型 (10个任务)</option>
            <option value="medium">中型 (25个任务)</option>
            <option value="large">大型 (50个任务)</option>
          </select>
        </div>
        
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>策略选择</h3>
          <select 
            value={strategy} 
            onChange={(e) => setStrategy(e.target.value)}
            style={styles.select}
          >
            <option value="nearest">最近任务优先</option>
            <option value="largest">最大任务优先</option>
          </select>
        </div>
        
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>控制</h3>
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{...styles.button, ...styles.buttonBlue}}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button 
              onClick={initializeScenario}
              style={{...styles.button, ...styles.buttonGray}}
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
        
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>状态</h3>
          <p>时间: {currentTime.toFixed(1)} 分钟</p>
          <p>救援人员: 15 名</p>
          <p>救援进度: {totalInitialVictims > 0 ? ((totalRescued / totalInitialVictims) * 100).toFixed(1) : 0}%</p>
          <p>状态: {rescuerState}</p>
          <p>当前任务: {currentTaskId ?? '无'}</p>
        </div>
      </div>
      
      <div style={styles.mapContainer}>
        {/* 救援中心 */}
        <div 
          style={{
            ...styles.circle,
            ...styles.rescuerCenter,
            left: '50%',
            top: '50%'
          }}
        />
        
        {/* 灾情点 */}
        {tasks.map(task => (
          <div
            key={task.id}
            style={{
              ...styles.circle,
              ...styles.taskCircle,
              ...(task.reported ? styles.taskOrange : styles.taskGray),
              left: `${task.x}%`,
              top: `${task.y}%`,
              opacity: task.currentVictims > 0 ? 1 : 0.3,
              border: task.id === currentTaskId ? '3px solid green' : '2px solid black'
            }}
          >
            {Math.round(task.currentVictims)}
          </div>
        ))}
        
        {/* 救援队伍 */}
        <div
          style={{
            ...styles.circle,
            ...styles.rescuerTeam,
            left: `${rescuerPosition.x}%`,
            top: `${rescuerPosition.y}%`
          }}
        >
          15
        </div>
      </div>
      
      <div style={{...styles.grid, marginTop: '24px'}}>
        <div style={styles.card}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>图例说明</h3>
          <ul style={styles.legendList}>
            <li style={styles.legendItem}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#dc2626',
                borderRadius: '50%'
              }}/>
              <span>救援中心</span>
            </li>
            <li style={styles.legendItem}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#f97316',
                borderRadius: '50%'
              }}/>
              <span>已报告灾情点</span>
            </li>
            <li style={styles.legendItem}>
              <div style={{
                width: '16px',
                height: '16px',
                background: '#9ca3af',
                borderRadius: '50%'
              }}/>
              <span>未报告灾情点</span>
            </li>
            <li style={styles.legendItem}>
              <div style={{
                width: '24px',
                height: '24px',
                background: '#2563eb',
                borderRadius: '50%',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>
                15
              </div>
              <span>救援队伍(15人)</span>
            </li>
          </ul>
        </div>
        
        {results && (
          <div style={styles.card}>
            <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>模拟结果</h3>
            <ul style={styles.legendList}>
              <li>成功率: {(results.successRate * 100).toFixed(1)}%</li>
              <li>完成时间: {results.time.toFixed(1)} 分钟</li>
              <li>总受灾人数: {results.totalVictims}</li>
              <li>成功救援: {Math.round(results.rescuedVictims)}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyComparisonSimulation;
export default EmergencySimulation;