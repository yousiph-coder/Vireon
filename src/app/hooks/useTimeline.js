import { useReducer, useCallback } from 'react';

const MAX_UNDO = 50;

const initialState = {
  segments: [],
  undoStack: [],
  redoStack: [],
  selectedIds: [],
  zoomLevel: 1,
  bladeMode: false,
};

function deepClone(arr) {
  return JSON.parse(JSON.stringify(arr));
}

function pushUndo(state) {
  const newStack = [...state.undoStack, deepClone(state.segments)];
  if (newStack.length > MAX_UNDO) newStack.shift();
  return { undoStack: newStack, redoStack: [] };
}

function timelineReducer(state, action) {
  switch (action.type) {
    case 'LOAD_SEGMENTS':
      return { 
        ...state, 
        segments: deepClone(action.payload), 
        undoStack: [], 
        redoStack: [], 
        selectedIds: [] 
      };
    
    case 'SPLIT': {
      const time = action.payload;
      const segIdx = state.segments.findIndex(s => time > s.start && time < s.end);
      if (segIdx === -1) return state;
      const seg = state.segments[segIdx];
      const newSegs = deepClone(state.segments);
      const left = { ...seg, end: time };
      const right = { ...seg, id: seg.id + '_split_' + Date.now(), start: time };
      newSegs.splice(segIdx, 1, left, right);
      return { ...state, segments: newSegs, ...pushUndo(state) };
    }
    
    case 'DELETE': {
      const idx = action.payload;
      const newSegs = deepClone(state.segments);
      if (newSegs[idx]) newSegs[idx].type = 'remove';
      return { ...state, segments: newSegs, ...pushUndo(state) };
    }
    
    case 'TOGGLE': {
      const idx = action.payload;
      const newSegs = deepClone(state.segments);
      if (newSegs[idx]) newSegs[idx].type = newSegs[idx].type === 'keep' ? 'remove' : 'keep';
      return { ...state, segments: newSegs, ...pushUndo(state) };
    }
    
    case 'RESTORE': {
      const idx = action.payload;
      const newSegs = deepClone(state.segments);
      if (newSegs[idx]) newSegs[idx].type = 'keep';
      return { ...state, segments: newSegs, ...pushUndo(state) };
    }
    
    case 'RIPPLE_DELETE': {
      const idx = action.payload;
      const targetSeg = state.segments[idx];
      if (!targetSeg) return state;
      
      const duration = targetSeg.end - targetSeg.start;
      const newSegs = deepClone(state.segments);
      newSegs.splice(idx, 1);
      
      // Shift start and end of all subsequent segments
      for (let i = idx; i < newSegs.length; i++) {
        newSegs[i].start -= duration;
        newSegs[i].end -= duration;
      }
      
      return { ...state, segments: newSegs, ...pushUndo(state), selectedIds: [] };
    }
    
    case 'DELETE_FORWARD': {
      const time = action.payload;
      const newSegs = deepClone(state.segments);
      for (let i = 0; i < newSegs.length; i++) {
        if (newSegs[i].start >= time) {
          newSegs[i].type = 'remove';
        } else if (newSegs[i].end > time && newSegs[i].start < time) {
          const left = { ...newSegs[i], end: time };
          const right = { ...newSegs[i], id: newSegs[i].id + '_fwd_' + Date.now(), start: time, type: 'remove' };
          newSegs.splice(i, 1, left, right);
          i++;
        }
      }
      return { ...state, segments: newSegs, ...pushUndo(state) };
    }
    
    case 'DELETE_BACKWARD': {
      const time = action.payload;
      const newSegs = deepClone(state.segments);
      for (let i = 0; i < newSegs.length; i++) {
        if (newSegs[i].end <= time) {
          newSegs[i].type = 'remove';
        } else if (newSegs[i].start < time && newSegs[i].end > time) {
          const left = { ...newSegs[i], end: time, type: 'remove' };
          const right = { ...newSegs[i], id: newSegs[i].id + '_bwd_' + Date.now(), start: time };
          newSegs.splice(i, 1, left, right);
          i++;
        }
      }
      return { ...state, segments: newSegs, ...pushUndo(state) };
    }
    
    case 'TRIM': {
      const { index, start, end } = action.payload;
      const newSegs = deepClone(state.segments);
      if (newSegs[index]) {
        newSegs[index].start = start;
        newSegs[index].end = end;
      }
      return { ...state, segments: newSegs, ...pushUndo(state) };
    }
    
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newUndo = [...state.undoStack];
      const prev = newUndo.pop();
      return {
        ...state,
        segments: prev,
        undoStack: newUndo,
        redoStack: [...state.redoStack, deepClone(state.segments)],
        selectedIds: []
      };
    }
    
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const newRedo = [...state.redoStack];
      const next = newRedo.pop();
      return {
        ...state,
        segments: next,
        redoStack: newRedo,
        undoStack: [...state.undoStack, deepClone(state.segments)],
        selectedIds: []
      };
    }
    
    case 'SET_ZOOM':
      return { ...state, zoomLevel: Math.max(0.1, Math.min(10, action.payload)) };
    
    case 'TOGGLE_BLADE':
      return { ...state, bladeMode: !state.bladeMode };
    
    case 'SELECT':
      return { ...state, selectedIds: [action.payload] };
    
    case 'SELECT_ALL':
      return { ...state, selectedIds: state.segments.map((_, i) => i) };
    
    case 'DESELECT_ALL':
      return { ...state, selectedIds: [] };
    
    default:
      return state;
  }
}

export function useTimeline() {
  const [state, dispatch] = useReducer(timelineReducer, initialState);
  
  const loadSegments = useCallback((segs) => dispatch({ type: 'LOAD_SEGMENTS', payload: segs }), []);
  const split = useCallback((time) => dispatch({ type: 'SPLIT', payload: time }), []);
  const deleteSegment = useCallback((idx) => dispatch({ type: 'DELETE', payload: idx }), []);
  const toggleSegment = useCallback((idx) => dispatch({ type: 'TOGGLE', payload: idx }), []);
  const restoreSegment = useCallback((idx) => dispatch({ type: 'RESTORE', payload: idx }), []);
  const rippleDelete = useCallback((idx) => dispatch({ type: 'RIPPLE_DELETE', payload: idx }), []);
  const deleteForward = useCallback((time) => dispatch({ type: 'DELETE_FORWARD', payload: time }), []);
  const deleteBackward = useCallback((time) => dispatch({ type: 'DELETE_BACKWARD', payload: time }), []);
  const trimSegment = useCallback((index, start, end) => dispatch({ type: 'TRIM', payload: { index, start, end } }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const setZoom = useCallback((z) => dispatch({ type: 'SET_ZOOM', payload: z }), []);
  const toggleBlade = useCallback(() => dispatch({ type: 'TOGGLE_BLADE' }), []);
  const selectSegment = useCallback((idx) => dispatch({ type: 'SELECT', payload: idx }), []);
  const selectAll = useCallback(() => dispatch({ type: 'SELECT_ALL' }), []);
  const deselectAll = useCallback(() => dispatch({ type: 'DESELECT_ALL' }), []);
  
  return {
    ...state,
    loadSegments, 
    split, 
    deleteSegment, 
    toggleSegment, 
    restoreSegment,
    rippleDelete, 
    deleteForward, 
    deleteBackward, 
    trimSegment,
    undo, 
    redo, 
    setZoom, 
    toggleBlade, 
    selectSegment, 
    selectAll, 
    deselectAll
  };
}
