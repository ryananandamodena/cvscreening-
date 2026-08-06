import React, { useState, useEffect } from 'react';
import {
  BookOpen, Users, Award, Clock, Star, Search,
  Filter, Calendar, PlayCircle, CheckCircle2,
  User, TrendingUp, Download, Plus, Eye
} from 'lucide-react';
import { trainingService, TrainingProgram, EmployeeTraining } from '../../services/training.service';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const TrainingDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('catalog');
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [myTrainings, setMyTrainings] = useState<EmployeeTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsData, trainingsData] = await Promise.all([
        trainingService.getPrograms({ active: true }),
        trainingService.getEmployeeTrainings()
      ]);

      setPrograms(Array.isArray(programsData) ? programsData : programsData.data);
      setMyTrainings(trainingsData);
    } catch (err) {
      console.error('Failed to fetch training data:', err);
      showToast('error', 'Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (programId: number) => {
    try {
      setEnrolling(programId);
      await trainingService.enrollEmployee({ employeeId: 1, programId });
      showToast('success', 'Successfully enrolled in training program');
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Failed to enroll:', err);
      showToast('error', 'Failed to enroll in training program');
    } finally {
      setEnrolling(null);
    }
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || program.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || program.level === levelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = [...new Set(programs.map(p => p.category))];
  const stats = {
    totalPrograms: programs.length,
    myEnrollments: myTrainings.length,
    completedTrainings: myTrainings.filter(t => t.status === 'completed').length,
    inProgress: myTrainings.filter(t => t.status === 'in_progress').length,
    totalHours: myTrainings
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (programs.find(p => p.id === t.programId)?.duration || 0), 0)
  };

  const getStatusTone = (status: string): 'success' | 'info' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'enrolled': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'enrolled': return 'Enrolled';
      case 'cancelled': return 'Cancelled';
      case 'waitlisted': return 'Waitlisted';
      default: return status;
    }
  };

  const getLevelTone = (level: string): 'success' | 'info' | 'brand' | 'neutral' => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'info';
      case 'advanced': return 'brand';
      default: return 'neutral';
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <BookOpen size={32} />
            </div>
            Training & Development
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Enhance your skills with our comprehensive training programs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
          <Button variant="primary" size="md">
            <Plus size={16} className="mr-2" />
            Create Program
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#000000] p-4 rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Available Programs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalPrograms}</p>
            </div>
            <BookOpen className="h-8 w-8 text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#000000] p-4 rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">My Enrollments</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.myEnrollments}</p>
            </div>
            <Users className="h-8 w-8 text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#000000] p-4 rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-success-600">{stats.completedTrainings}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#000000] p-4 rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">In Progress</p>
              <p className="text-2xl font-bold text-info-600">{stats.inProgress}</p>
            </div>
            <Clock className="h-8 w-8 text-info-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#000000] p-4 rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Training Hours</p>
              <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.totalHours}</p>
            </div>
            <Award className="h-8 w-8 text-brand-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-[#000000] rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
        <div className="border-b border-slate-200 dark:border-neutral-800">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'catalog'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-700'
              }`}
            >
              Training Catalog
            </button>
            <button
              onClick={() => setActiveTab('my-training')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'my-training'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-700'
              }`}
            >
              My Training
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'certificates'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-700'
              }`}
            >
              Certificates
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search training programs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Programs Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-slate-100 dark:bg-neutral-800 rounded-xl p-6 animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-neutral-700 rounded mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-neutral-700 rounded mb-4"></div>
                      <div className="h-20 bg-slate-200 dark:bg-neutral-700 rounded mb-4"></div>
                      <div className="h-8 bg-slate-200 dark:bg-neutral-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPrograms.map((program) => {
                    const isEnrolled = myTrainings.some(t => t.programId === program.id);

                    return (
                      <div key={program.id} className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{program.title}</h3>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <Badge tone="neutral">{program.category}</Badge>
                              <Badge tone={getLevelTone(program.level)}>{program.level}</Badge>
                              {program.certification && (
                                <Badge tone="success">
                                  <span className="flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    Certified
                                  </span>
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${program.format === 'online' ? 'bg-success-500' : program.format === 'offline' ? 'bg-info-500' : 'bg-brand-500'}`}></div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">{program.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Clock className="w-4 h-4" />
                            <span>{program.duration} hours</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Users className="w-4 h-4" />
                            <span>{program.provider}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-slate-700 dark:text-slate-300">Cost: </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {program.cost === 0 ? 'Free' : `Rp ${program.cost.toLocaleString()}`}
                            </span>
                          </div>

                          {isEnrolled ? (
                            <Badge tone="success">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Enrolled
                              </span>
                            </Badge>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEnroll(program.id)}
                              disabled={enrolling === program.id}
                            >
                              {enrolling === program.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Enrolling...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Enroll
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredPrograms.length === 0 && !loading && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No training programs found</h3>
                  <p className="text-slate-700 dark:text-slate-300">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-training' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTrainings.map((training) => {
                  const program = programs.find(p => p.id === training.programId);

                  return (
                    <div key={training.id} className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{training.programTitle}</h3>
                          <Badge tone={getStatusTone(training.status)}>{getStatusLabel(training.status)}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-700 dark:text-slate-300">Progress</div>
                          <div className="text-lg font-semibold text-slate-900 dark:text-white">{training.progress}%</div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                            <span className="text-slate-900 dark:text-white font-medium">{training.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2">
                            <div
                              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${training.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {training.score && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-warning-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Score: {training.score}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {training.certificateUrl && (
                          <Button variant="secondary" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {myTrainings.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No training enrollments yet</h3>
                  <p className="text-slate-700 dark:text-slate-300 mb-6">Start your learning journey by enrolling in a training program</p>
                  <Button variant="primary" size="lg" onClick={() => setActiveTab('catalog')}>
                    Browse Training Catalog
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock certificates - in real app, this would come from API */}
                {[
                  { id: 1, title: 'React Development', issuer: 'Internal Training', date: '2024-01-15', expiry: '2026-01-15' },
                  { id: 2, title: 'Leadership Skills', issuer: 'External Provider', date: '2024-02-20', expiry: null },
                  { id: 3, title: 'Project Management', issuer: 'Internal Training', date: '2023-11-10', expiry: '2025-11-10' }
                ].map((cert) => (
                  <div key={cert.id} className="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/40 dark:to-brand-900/40 border border-brand-200 dark:border-brand-900/60 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/40 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{cert.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{cert.issuer}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Issued:</span>
                        <span className="text-slate-900 dark:text-white">{new Date(cert.date).toLocaleDateString()}</span>
                      </div>
                      {cert.expiry && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Expires:</span>
                          <span className="text-slate-900 dark:text-white">{new Date(cert.expiry).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <Button variant="primary" size="md" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDashboard;
