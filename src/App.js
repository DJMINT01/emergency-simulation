import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const EmergencyComparisonSimulation = () => {
  // 状态变量
  const [scenario, setScenario] = useState('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialTasksData, setInitialTasksData] = useState([]);
  const [totalInitialVictims, setTotalInitialVictims] = useState(0);
  const [rescueCenterPosition, setRescueCenterPosition] = useState({ x: 50, y: 50 });
  
  // 三个独立的模拟
  const [nearestSimulation, setNearestSimulation] = useState({
    tasks: [],
    rescuerPosition: { x: 50, y: 50 },
    rescuerState: 'IDLE',
    currentTaskId: null,
    rescued: 0,
    results: null,
    completed: false,
    completionTime: null
  });
  
  const [largestSimulation, setLargestSimulation] = useState({
    tasks: [],
    rescuerPosition: { x: 50, y: 50 },
    rescuerState: 'IDLE',
    currentTaskId: null,
    rescued: 0,
    results: null,
    completed: false,
    completionTime: null
  });
  
  // 新增：多智能体模拟
  const [multiAgentSimulation, setMultiAgentSimulation] = useState({
    tasks: [],
    // 五个独立救援小队，每队3人
    rescuers: [
      { id: 1, position: { x: 50, y: 50 }, state: 'IDLE', currentTaskId: null, type: 'NEAREST' },
      { id: 2, position: { x: 50, y: 50 }, state: 'IDLE', currentTaskId: null, type: 'LARGEST' },
      { id: 3, position: { x: 50, y: 50 }, state: 'IDLE', currentTaskId: null, type: 'NEAREST' },
      { id: 4, position: { x: 50, y: 50 }, state: 'IDLE', currentTaskId: null, type: 'LARGEST' },
      { id: 5, position: { x: 50, y: 50 }, state: 'IDLE', currentTaskId: null, type: 'HYBRID' }
    ],
    rescued: 0,
    results: null,
    taskAssignments: {}, // 记录哪个任务被哪个救援队分配了
    completed: false,
    completionTime: null
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
    
    // 使用当前时间戳作为随机种子，确保每次运行都有不同的随机地图
    // 但同一次模拟中的三个算法会使用完全相同的地图
    let seedValue = Date.now();
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
    
    // 随机生成救援中心位置
    const centerX = random() * 60 + 20; // 20-80 范围内
    const centerY = random() * 60 + 20; // 20-80 范围内
    
    // 保存救援中心位置
    setRescueCenterPosition({ x: centerX, y: centerY });
    
    for (let i = 0; i < numTasks; i++) {
      // 随机生成灾情点位置，避免与救援中心重叠
      let x, y;
      do {
        x = random() * 80 + 10; // 10-90 范围内
        y = random() * 80 + 10; // 10-90 范围内
      } while (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) < 5); // 确保与救援中心有一定距离
      
      const position = { x, y };
      
      // 距离越远，报告时间越长
      const distance = Math.sqrt(Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2));
      const reportTime = distance / 5;
      
      // 随机生成受灾人数 (50-500)
      const victims = Math.floor(random() * 450) + 50;
      
      // 随机衰减率 (0.1-0.2)，表示情况紧急程度
      const declineRate = 0.1 + random() * 0.1;
      
      newTasks.push({
        id: i,
        ...position,
        initialVictims: victims,
        currentVictims: victims,
        declineRate: declineRate,
        reported: false,
        reportTime: reportTime
      });
      
      initialVictims += victims;
    }
    
    // 保存初始任务数据
    setInitialTasksData(newTasks);
    setTotalInitialVictims(initialVictims);
    
    // 重置三个模拟
    setNearestSimulation({
      tasks: JSON.parse(JSON.stringify(newTasks)),
      rescuerPosition: { x: centerX, y: centerY },
      rescuerState: 'IDLE',
      currentTaskId: null,
      rescued: 0,
      results: null,
      completed: false,
      completionTime: null
    });
    
    setLargestSimulation({
      tasks: JSON.parse(JSON.stringify(newTasks)),
      rescuerPosition: { x: centerX, y: centerY },
      rescuerState: 'IDLE',
      currentTaskId: null,
      rescued: 0,
      results: null,
      completed: false,
      completionTime: null
    });
    
    // 重置多智能体模拟
    setMultiAgentSimulation({
      tasks: JSON.parse(JSON.stringify(newTasks)),
      rescuers: [
        { id: 1, position: { x: centerX, y: centerY }, state: 'IDLE', currentTaskId: null, type: 'NEAREST' },
        { id: 2, position: { x: centerX, y: centerY }, state: 'IDLE', currentTaskId: null, type: 'LARGEST' },
        { id: 3, position: { x: centerX, y: centerY }, state: 'IDLE', currentTaskId: null, type: 'NEAREST' },
        { id: 4, position: { x: centerX, y: centerY }, state: 'IDLE', currentTaskId: null, type: 'LARGEST' },
        { id: 5, position: { x: centerX, y: centerY }, state: 'IDLE', currentTaskId: null, type: 'HYBRID' }
      ],
      rescued: 0,
      results: null,
      taskAssignments: {},
      completed: false,
      completionTime: null
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
    
    // 更新多智能体模拟
    setMultiAgentSimulation(prev => {
      const updatedSimulation = { ...prev };
      let rescuedThisStep = 0;
      
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
      
      // 创建任务分配计划
      // 更新救援队伍
      updatedSimulation.rescuers = prev.rescuers.map(rescuer => {
        const updatedRescuer = { ...rescuer };
        
        // 根据救援队员的状态更新
        switch (updatedRescuer.state) {
          case 'IDLE':
            // 空闲状态，选择新任务
            // 只考虑已报告且还有受灾人员的任务
            const availableTasks = updatedSimulation.tasks.filter(task => 
              task.reported && task.currentVictims > 0
            );
            
            if (availableTasks.length > 0) {
              let selectedTask;
              
              // 基于救援队类型选择任务
              if (updatedRescuer.type === 'NEAREST') {
                // 最近任务优先
                selectedTask = availableTasks.reduce((closest, task) => {
                  // 避免选择已经被其他救援队分配的任务，除非没有其他选择
                  if (updatedSimulation.taskAssignments[task.id] && availableTasks.length > 1) {
                    return closest;
                  }
                  
                  const distToCurrent = getDistance(updatedRescuer.position, task);
                  const distToClosest = getDistance(updatedRescuer.position, closest);
                  return distToCurrent < distToClosest ? task : closest;
                });
              } else if (updatedRescuer.type === 'LARGEST') {
                // 最大任务优先
                selectedTask = availableTasks.reduce((largest, task) => {
                  // 避免选择已经被其他救援队分配的任务，除非没有其他选择
                  if (updatedSimulation.taskAssignments[task.id] && availableTasks.length > 1) {
                    return largest;
                  }
                  
                  return task.currentVictims > largest.currentVictims ? task : largest;
                });
              } else {
                // HYBRID - 综合考虑距离和任务大小
                selectedTask = availableTasks.reduce((best, task) => {
                  // 避免选择已经被其他救援队分配的任务，除非没有其他选择
                  if (updatedSimulation.taskAssignments[task.id] && availableTasks.length > 1) {
                    return best;
                  }
                  
                  const distToCurrent = getDistance(updatedRescuer.position, task);
                  const distToBest = getDistance(updatedRescuer.position, best);
                  
                  // 混合评分：距离和任务大小的加权组合
                  // 距离越近越好，任务越大越好
                  const currentScore = (task.currentVictims / distToCurrent);
                  const bestScore = (best.currentVictims / distToBest);
                  
                  return currentScore > bestScore ? task : best;
                });
              }
              
              // 更新任务分配
              updatedSimulation.taskAssignments = {
                ...updatedSimulation.taskAssignments,
                [selectedTask.id]: updatedRescuer.id
              };
              
              updatedRescuer.currentTaskId = selectedTask.id;
              updatedRescuer.state = 'MOVING_TO_TASK';
            }
            break;
            
          case 'MOVING_TO_TASK':
            // 移动到任务点
            if (updatedRescuer.currentTaskId !== null) {
              const task = updatedSimulation.tasks.find(t => t.id === updatedRescuer.currentTaskId);
              if (task) {
                const distance = getDistance(updatedRescuer.position, task);
                
                if (distance < 1) {
                  // 到达目标位置
                  updatedRescuer.position = { x: task.x, y: task.y };
                  updatedRescuer.state = 'AT_TASK';
                } else {
                  // 继续移动
                  const moveSpeed = 1;
                  const dx = task.x - updatedRescuer.position.x;
                  const dy = task.y - updatedRescuer.position.y;
                  
                  updatedRescuer.position = {
                    x: updatedRescuer.position.x + (dx / distance) * moveSpeed,
                    y: updatedRescuer.position.y + (dy / distance) * moveSpeed
                  };
                }
              }
            }
            break;
            
          case 'AT_TASK':
            // 执行救援
            if (updatedRescuer.currentTaskId !== null) {
              const taskIndex = updatedSimulation.tasks.findIndex(t => t.id === updatedRescuer.currentTaskId);
              if (taskIndex !== -1) {
                const task = updatedSimulation.tasks[taskIndex];
                
                if (task.currentVictims <= 0) {
                  // 任务完成，释放任务分配
                  delete updatedSimulation.taskAssignments[updatedRescuer.currentTaskId];
                  updatedRescuer.currentTaskId = null;
                  updatedRescuer.state = 'IDLE';
                } else {
                  // 单个救援队每次救援能力为6人（一个救援队有3人）
                  const maxPossibleRescue = Math.min(task.currentVictims, 6);
                  const actualRescued = Math.min(maxPossibleRescue, totalInitialVictims - (updatedSimulation.rescued + rescuedThisStep));
                  
                  if (actualRescued > 0) {
                    rescuedThisStep += actualRescued;
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
        
        return updatedRescuer;
      });
      
      // 更新总救援人数
      updatedSimulation.rescued = Math.min(updatedSimulation.rescued + rescuedThisStep, totalInitialVictims);
      
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
        
        // 检查每个模拟是否已完成其所有任务
        setNearestSimulation(prev => {
          if (!prev.completed && prev.tasks.every(task => task.currentVictims <= 0)) {
            return {
              ...prev,
              completed: true,
              completionTime: currentTime,
              results: {
                successRate: prev.rescued / totalInitialVictims,
                time: currentTime
              }
            };
          }
          return prev;
        });
        
        setLargestSimulation(prev => {
          if (!prev.completed && prev.tasks.every(task => task.currentVictims <= 0)) {
            return {
              ...prev,
              completed: true,
              completionTime: currentTime,
              results: {
                successRate: prev.rescued / totalInitialVictims,
                time: currentTime
              }
            };
          }
          return prev;
        });
        
        setMultiAgentSimulation(prev => {
          if (!prev.completed && prev.tasks.every(task => task.currentVictims <= 0)) {
            return {
              ...prev,
              completed: true,
              completionTime: currentTime,
              results: {
                successRate: prev.rescued / totalInitialVictims,
                time: currentTime
              }
            };
          }
          return prev;
        });
        
        // 检查是否所有模拟都已完成或者超时
        const allCompleted = nearestSimulation.completed && 
                            largestSimulation.completed && 
                            multiAgentSimulation.completed;
        const timeExceeded = currentTime >= 300;
        
        if (allCompleted || timeExceeded) {
          setIsPlaying(false);
          
          // 处理任何尚未完成但时间已超时的模拟
          if (!nearestSimulation.completed) {
            setNearestSimulation(prev => ({
              ...prev,
              completed: true,
              completionTime: currentTime,
              results: {
                successRate: prev.rescued / totalInitialVictims,
                time: currentTime
              }
            }));
          }
          
          if (!largestSimulation.completed) {
            setLargestSimulation(prev => ({
              ...prev,
              completed: true,
              completionTime: currentTime,
              results: {
                successRate: prev.rescued / totalInitialVictims,
                time: currentTime
              }
            }));
          }
          
          if (!multiAgentSimulation.completed) {
            setMultiAgentSimulation(prev => ({
              ...prev,
              completed: true,
              completionTime: currentTime,
              results: {
                successRate: prev.rescued / totalInitialVictims,
                time: currentTime
              }
            }));
          }
        }
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, nearestSimulation, largestSimulation, multiAgentSimulation, totalInitialVictims]);
  
  // 确定哪种算法救援效果最好
  const getBestAlgorithm = () => {
    if (!nearestSimulation.results || !largestSimulation.results || !multiAgentSimulation.results) {
      return null;
    }
    
    const rates = [
      { name: "最近任务优先", rate: nearestSimulation.results.successRate, time: nearestSimulation.completionTime },
      { name: "最大任务优先", rate: largestSimulation.results.successRate, time: largestSimulation.completionTime },
      { name: "多智能体策略", rate: multiAgentSimulation.results.successRate, time: multiAgentSimulation.completionTime }
    ];
    
    // 首先按成功率排序，如果成功率相同则按完成时间排序
    return rates.sort((a, b) => {
      if (a.rate !== b.rate) {
        return b.rate - a.rate; // 成功率降序
      }
      // 如果成功率相同，比较完成时间
      return a.time - b.time; // 完成时间升序
    })[0];
  };
  
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
              style={{...styles.button, ...styles.buttonBlue, flex: 1}}
            >
              {isPlaying ? <><Pause size={20} /> 暂停</> : <><Play size={20} /> 开始</>}
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
      
      <div style={{...styles.card, marginBottom: '16px'}}>
        <button 
          onClick={initializeScenario}
          style={{
            padding: '12px 24px',
            background: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            width: '100%',
            justifyContent: 'center',
            fontSize: '16px'
          }}
        >
          <RotateCcw size={20} /> 生成新的随机地图
        </button>
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
            left: `${rescueCenterPosition.x}%`,
            top: `${rescueCenterPosition.y}%`
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
            left: `${rescueCenterPosition.x}%`,
            top: `${rescueCenterPosition.y}%`
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
      
      {/* 多智能体算法地图 */}
      <div style={{...styles.mapContainer, borderColor: '#10b981'}}>
        <div style={styles.mapLabel}>多智能体策略</div>
        
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
          <div>救援进度: {(Math.min(multiAgentSimulation.rescued / totalInitialVictims, 1) * 100).toFixed(1)}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min(multiAgentSimulation.rescued / totalInitialVictims, 1) * 100}%`,
                backgroundColor: '#10b981'
              }}
            />
          </div>
        </div>
        
        {/* 救援中心 */}
        <div 
          style={{
            ...styles.circle,
            ...styles.rescuerCenter,
            left: `${rescueCenterPosition.x}%`,
            top: `${rescueCenterPosition.y}%`
          }}
        />
        
        {/* 灾情点 */}
        {multiAgentSimulation.tasks.map(task => (
          <div
            key={task.id}
            style={{
              ...styles.circle,
              ...styles.taskCircle,
              ...(task.reported ? styles.taskOrange : styles.taskGray),
              left: `${task.x}%`,
              top: `${task.y}%`,
              opacity: task.currentVictims > 0 ? 1 : 0.3,
              border: multiAgentSimulation.taskAssignments[task.id] ? '3px solid green' : '2px solid black'
            }}
          >
            {Math.round(task.currentVictims)}
          </div>
        ))}
        
        {/* 救援队伍 */}
        {multiAgentSimulation.rescuers.map(rescuer => (
          <div
            key={rescuer.id}
            style={{
              ...styles.circle,
              ...styles.rescuerTeam,
              left: `${rescuer.position.x}%`,
              top: `${rescuer.position.y}%`,
              backgroundColor: 
                rescuer.type === 'NEAREST' ? '#10b981' : 
                rescuer.type === 'LARGEST' ? '#8b5cf6' : 
                '#f59e0b', // HYBRID
              width: '18px',
              height: '18px'
            }}
          >
            {rescuer.id}
          </div>
        ))}
      </div>
      
      {/* 对比结果 */}
      {(nearestSimulation.results || largestSimulation.results || multiAgentSimulation.results) && (
        <div style={{...styles.card, marginTop: '16px'}}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>模拟结果对比</h3>
          <div style={{display: 'flex', gap: '16px'}}>
            <div style={{flex: 1}}>
              <h4 style={{fontWeight: 'bold', color: '#3b82f6'}}>最近任务优先</h4>
              <ul style={styles.legendList}>
                <li>成功率: {nearestSimulation.results ? (nearestSimulation.results.successRate * 100).toFixed(1) : 0}%</li>
                <li>完成时间: {nearestSimulation.completionTime ? nearestSimulation.completionTime.toFixed(1) : "未完成"} 分钟</li>
                <li>救援人数: {Math.round(nearestSimulation.rescued)}</li>
              </ul>
            </div>
            <div style={{flex: 1}}>
              <h4 style={{fontWeight: 'bold', color: '#ef4444'}}>最大任务优先</h4>
              <ul style={styles.legendList}>
                <li>成功率: {largestSimulation.results ? (largestSimulation.results.successRate * 100).toFixed(1) : 0}%</li>
                <li>完成时间: {largestSimulation.completionTime ? largestSimulation.completionTime.toFixed(1) : "未完成"} 分钟</li>
                <li>救援人数: {Math.round(largestSimulation.rescued)}</li>
              </ul>
            </div>
            <div style={{flex: 1}}>
              <h4 style={{fontWeight: 'bold', color: '#10b981'}}>多智能体策略</h4>
              <ul style={styles.legendList}>
                <li>成功率: {multiAgentSimulation.results ? (multiAgentSimulation.results.successRate * 100).toFixed(1) : 0}%</li>
                <li>完成时间: {multiAgentSimulation.completionTime ? multiAgentSimulation.completionTime.toFixed(1) : "未完成"} 分钟</li>
                <li>救援人数: {Math.round(multiAgentSimulation.rescued)}</li>
              </ul>
            </div>
          </div>
          <div style={{marginTop: '16px'}}>
            <h4 style={{fontWeight: 'bold'}}>胜出策略:</h4>
            {nearestSimulation.results && largestSimulation.results && multiAgentSimulation.results && (
              <p style={{fontSize: '16px', fontWeight: 'bold'}}>
                {getBestAlgorithm()?.name} 
                (成功率: {(getBestAlgorithm()?.rate * 100).toFixed(1)}%, 
                完成时间: {getBestAlgorithm()?.time?.toFixed(1) || "未完成"} 分钟)
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
              width: '18px',
              height: '18px',
              background: '#10b981',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px'
            }}>
              1
            </div>
            <span>多智能体-最近任务优先队伍</span>
          </li>
          <li style={styles.legendItem}>
            <div style={{
              width: '18px',
              height: '18px',
              background: '#8b5cf6',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px'
            }}>
              2
            </div>
            <span>多智能体-最大任务优先队伍</span>
          </li>
          <li style={styles.legendItem}>
            <div style={{
              width: '18px',
              height: '18px',
              background: '#f59e0b',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px'
            }}>
              5
            </div>
            <span>多智能体-混合策略队伍</span>
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
    </div>
  );
};

export default EmergencyComparisonSimulation;