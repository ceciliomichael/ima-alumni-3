import { useState, useEffect } from 'react';
import { Target, Calendar, Save, Check, Trash2, TrendingUp, Award } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { 
  getAllGoals, 
  saveGoal, 
  setActiveGoal, 
  deleteGoal 
} from '../../../../services/firebase/donationGoalService';
import { DonationGoal } from '../../../../types';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const DonationGoalSettings = () => {
  const [goals, setGoals] = useState<DonationGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalRaised, setTotalRaised] = useState(0);
  
  // Form state
  const [goalType, setGoalType] = useState<'monthly' | 'yearly'>('monthly');
  const [amount, setAmount] = useState<number>(0);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    loadGoals();
    loadTotalRaised();
  }, []);

  const loadTotalRaised = async () => {
    try {
      const donationsRef = collection(db, 'donations');
      const q = query(donationsRef, where('isPublic', '==', true));
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        return acc + (data.amount || 0);
      }, 0);
      setTotalRaised(total);
    } catch (error) {
      console.error('Error loading total raised:', error);
    }
  };

  const loadGoals = async () => {
    try {
      setLoading(true);
      const allGoals = await getAllGoals();
      setGoals(allGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    if (amount <= 0) {
      alert('Please enter a valid goal amount');
      return;
    }

    try {
      setSaving(true);
      await saveGoal({
        goalType,
        amount,
        year,
        month: goalType === 'monthly' ? month : undefined,
        isActive: goals.length === 0 // Make active if first goal
      });
      await loadGoals();
      
      // Reset form
      setAmount(0);
      alert('Goal saved successfully!');
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (goalId: string) => {
    try {
      setSaving(true);
      await setActiveGoal(goalId);
      await loadGoals();
    } catch (error) {
      console.error('Error setting active goal:', error);
      alert('Failed to set active goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      setSaving(true);
      await deleteGoal(goalId);
      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getMonthLabel = (monthNum: number) => {
    return MONTHS.find(m => m.value === monthNum)?.label || '';
  };

  const formatGoalPeriod = (goal: DonationGoal) => {
    if (goal.goalType === 'monthly') {
      return `${getMonthLabel(goal.month || 1)} ${goal.year}`;
    }
    return `Year ${goal.year}`;
  };

  const getGoalProgress = (goal: DonationGoal) => {
    if (!goal.isActive) return null;
    const percentage = goal.amount > 0 ? Math.min((totalRaised / goal.amount) * 100, 100) : 0;
    const isCompleted = totalRaised >= goal.amount;
    return { percentage, isCompleted, raised: totalRaised };
  };

  // Find active goal for header display
  const activeGoal = goals.find(g => g.isActive);
  const activeProgress = activeGoal ? getGoalProgress(activeGoal) : null;

  return (
    <div className="donation-goal-settings">
      <div className="goal-settings-header">
        <div className="goal-header-left">
          <div className="goal-settings-icon">
            <Target size={20} />
          </div>
          <div className="goal-header-text">
            <h3 className="goal-settings-title">Donation Goals</h3>
            <p className="goal-settings-subtitle">Set monthly or yearly fundraising targets</p>
          </div>
        </div>
        {activeGoal && activeProgress && (
          <div className="goal-header-stats">
            <div className="goal-stat">
              <TrendingUp size={16} />
              <span className="goal-stat-value">{formatCurrency(activeProgress.raised)}</span>
              <span className="goal-stat-label">raised</span>
            </div>
            <div className="goal-stat">
              <Target size={16} />
              <span className="goal-stat-value">{formatCurrency(activeGoal.amount)}</span>
              <span className="goal-stat-label">target</span>
            </div>
            {activeProgress.isCompleted && (
              <div className="goal-completed-badge">
                <Award size={14} />
                Goal Reached!
              </div>
            )}
          </div>
        )}
      </div>

      <div className="goal-settings-content">
        {/* Goal Form */}
        <div className="goal-form-section">
          <h4 className="goal-form-subtitle">Set New Goal</h4>
          
          <div className="goal-form-row">
            <div className="goal-form-group">
              <label className="goal-form-label">Goal Type</label>
              <div className="goal-type-toggle">
                <button
                  type="button"
                  className={`goal-type-btn ${goalType === 'monthly' ? 'active' : ''}`}
                  onClick={() => setGoalType('monthly')}
                >
                  <Calendar size={16} />
                  Monthly
                </button>
                <button
                  type="button"
                  className={`goal-type-btn ${goalType === 'yearly' ? 'active' : ''}`}
                  onClick={() => setGoalType('yearly')}
                >
                  <Calendar size={16} />
                  Yearly
                </button>
              </div>
            </div>
          </div>

          <div className="goal-form-row">
            <div className="goal-form-group">
              <label className="goal-form-label">Year</label>
              <select
                className="goal-form-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {goalType === 'monthly' && (
              <div className="goal-form-group">
                <label className="goal-form-label">Month</label>
                <select
                  className="goal-form-select"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="goal-form-row">
            <div className="goal-form-group goal-form-group-full">
              <label className="goal-form-label">Target Amount (PHP)</label>
              <input
                type="number"
                className="goal-form-input"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter goal amount"
                min="0"
              />
            </div>
          </div>

          <button
            className="goal-save-btn"
            onClick={handleSaveGoal}
            disabled={saving || amount <= 0}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Goal'}
          </button>
        </div>

        {/* Existing Goals List */}
        <div className="goal-list-section">
          <h4 className="goal-form-subtitle">Existing Goals</h4>
          
          {loading ? (
            <div className="goal-loading">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="goal-empty">No donation goals set yet.</div>
          ) : (
            <div className="goal-list">
              {goals.map(goal => (
                <div 
                  key={goal.id} 
                  className={`goal-item ${goal.isActive ? 'goal-item-active' : ''}`}
                >
                  <div className="goal-item-info">
                    <span className={`goal-badge ${goal.goalType === 'monthly' ? 'goal-badge-monthly' : 'goal-badge-yearly'}`}>
                      {goal.goalType === 'monthly' ? 'Monthly' : 'Yearly'}
                    </span>
                    <span className="goal-period">{formatGoalPeriod(goal)}</span>
                    <span className="goal-amount">{formatCurrency(goal.amount)}</span>
                    {goal.isActive && (
                      <span className="goal-active-badge">
                        <Check size={12} />
                        Active
                      </span>
                    )}
                    {goal.isActive && getGoalProgress(goal) && (
                      <>
                        <span className="goal-progress-text">
                          {getGoalProgress(goal)?.percentage.toFixed(0)}% complete
                        </span>
                        {getGoalProgress(goal)?.isCompleted && (
                          <span className="goal-done-badge">
                            <Award size={12} />
                            Done
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="goal-item-actions">
                    {!goal.isActive && (
                      <button
                        className="goal-action-btn goal-action-activate"
                        onClick={() => handleSetActive(goal.id)}
                        disabled={saving}
                        title="Set as Active"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      className="goal-action-btn goal-action-delete"
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={saving}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationGoalSettings;
