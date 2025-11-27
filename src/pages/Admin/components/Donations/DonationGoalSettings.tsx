import { useState, useEffect } from 'react';
import { Target, Calendar, Save, Trash2, TrendingUp, Check } from 'lucide-react';
import { 
  getAllGoals, 
  saveGoal, 
  toggleGoalActive, 
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
  }, []);

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

  const handleToggleActive = async (goalId: string, currentlyActive: boolean) => {
    try {
      setSaving(true);
      await toggleGoalActive(goalId, !currentlyActive);
      await loadGoals();
    } catch (error) {
      console.error('Error toggling goal active state:', error);
      alert('Failed to update goal. Please try again.');
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

  // Separate goals by type
  const monthlyGoals = goals.filter(g => g.goalType === 'monthly').sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (b.month || 0) - (a.month || 0);
  });
  const yearlyGoals = goals.filter(g => g.goalType === 'yearly').sort((a, b) => b.year - a.year);
  
  // Find active goals by type
  const activeMonthlyGoal = monthlyGoals.find(g => g.isActive);
  const activeYearlyGoal = yearlyGoals.find(g => g.isActive);

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
        <div className="goal-header-stats">
          {activeMonthlyGoal && (
            <div className="goal-stat goal-stat-monthly">
              <Calendar size={16} />
              <span className="goal-stat-value">{formatCurrency(activeMonthlyGoal.amount)}</span>
              <span className="goal-stat-label">monthly</span>
            </div>
          )}
          {activeYearlyGoal && (
            <div className="goal-stat goal-stat-yearly">
              <TrendingUp size={16} />
              <span className="goal-stat-value">{formatCurrency(activeYearlyGoal.amount)}</span>
              <span className="goal-stat-label">yearly</span>
            </div>
          )}
          {!activeMonthlyGoal && !activeYearlyGoal && (
            <div className="goal-stat goal-stat-none">
              <Target size={16} />
              <span className="goal-stat-label">No active goals</span>
            </div>
          )}
        </div>
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

        {/* Existing Goals List - Separated by Type */}
        <div className="goal-list-section">
          <h4 className="goal-form-subtitle">Manage Goals</h4>
          <p className="goal-list-description">
            Check the box to set a goal as active. You can have one active monthly goal and one active yearly goal at the same time.
          </p>
          
          {loading ? (
            <div className="goal-loading">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="goal-empty">No donation goals set yet.</div>
          ) : (
            <div className="goal-sections">
              {/* Monthly Goals Section */}
              <div className="goal-type-section">
                <div className="goal-type-header">
                  <Calendar size={18} />
                  <span>Monthly Goals</span>
                  {activeMonthlyGoal && (
                    <span className="goal-type-active-indicator">1 Active</span>
                  )}
                </div>
                {monthlyGoals.length === 0 ? (
                  <div className="goal-type-empty">No monthly goals set</div>
                ) : (
                  <div className="goal-list">
                    {monthlyGoals.map(goal => (
                      <div 
                        key={goal.id} 
                        className={`goal-item ${goal.isActive ? 'goal-item-active' : ''}`}
                      >
                        <label className="goal-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={goal.isActive}
                            onChange={() => handleToggleActive(goal.id, goal.isActive)}
                            disabled={saving}
                            className="goal-checkbox"
                          />
                          <span className="goal-checkbox-custom">
                            {goal.isActive && <Check size={12} />}
                          </span>
                        </label>
                        <div className="goal-item-info">
                          <span className="goal-period">{formatGoalPeriod(goal)}</span>
                          <span className="goal-amount">{formatCurrency(goal.amount)}</span>
                        </div>
                        <button
                          className="goal-action-btn goal-action-delete"
                          onClick={() => handleDeleteGoal(goal.id)}
                          disabled={saving}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Yearly Goals Section */}
              <div className="goal-type-section">
                <div className="goal-type-header">
                  <TrendingUp size={18} />
                  <span>Yearly Goals</span>
                  {activeYearlyGoal && (
                    <span className="goal-type-active-indicator yearly">1 Active</span>
                  )}
                </div>
                {yearlyGoals.length === 0 ? (
                  <div className="goal-type-empty">No yearly goals set</div>
                ) : (
                  <div className="goal-list">
                    {yearlyGoals.map(goal => (
                      <div 
                        key={goal.id} 
                        className={`goal-item ${goal.isActive ? 'goal-item-active' : ''}`}
                      >
                        <label className="goal-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={goal.isActive}
                            onChange={() => handleToggleActive(goal.id, goal.isActive)}
                            disabled={saving}
                            className="goal-checkbox"
                          />
                          <span className="goal-checkbox-custom yearly">
                            {goal.isActive && <Check size={12} />}
                          </span>
                        </label>
                        <div className="goal-item-info">
                          <span className="goal-period">{formatGoalPeriod(goal)}</span>
                          <span className="goal-amount">{formatCurrency(goal.amount)}</span>
                        </div>
                        <button
                          className="goal-action-btn goal-action-delete"
                          onClick={() => handleDeleteGoal(goal.id)}
                          disabled={saving}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationGoalSettings;
