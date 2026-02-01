
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  List, 
  PlusCircle, 
  Loader2,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import { AppView, Lesson, Exercise, AppState } from './types';
import { generateLessonContent } from './services/geminiService';

const STORAGE_KEY = 'assist_learning_lessons';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'TOP',
    currentLessonId: null,
    currentExerciseIndex: 0,
    lessons: [],
    isGenerating: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(prev => ({ ...prev, lessons: JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to parse lessons", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lessons));
  }, [state.lessons]);

  const currentLesson = state.lessons.find(l => l.id === state.currentLessonId);

  const navigateTo = (view: AppView) => setState(prev => ({ ...prev, view }));

  const startLesson = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      currentLessonId: id, 
      view: 'SUMMARY', 
      currentExerciseIndex: 0 
    }));
  };

  const handleUpload = async (title: string, driveUrl: string, images: string[]) => {
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const aiData = await generateLessonContent(title, driveUrl, images);
      const newLesson: Lesson = {
        id: `lesson-${Date.now()}`,
        title,
        date: new Date().toLocaleDateString('ja-JP'),
        transcription: driveUrl, // URLを保存
        images,
        aiData
      };
      setState(prev => ({
        ...prev,
        lessons: [newLesson, ...prev.lessons],
        isGenerating: false,
        view: 'LIST'
      }));
    } catch (error) {
      console.error("Content generation failed", error);
      alert("AIによる解析に失敗しました。正しいURLかどうか確認し、もう一度試してください。");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const deleteLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("この授業データを削除しますか？")) {
      setState(prev => ({
        ...prev,
        lessons: prev.lessons.filter(l => l.id !== id)
      }));
    }
  };

  const renderView = () => {
    switch (state.view) {
      case 'TOP':
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800">アシスト・ラーニング</h1>
              <p className="text-slate-500 max-w-sm">授業を休んでも大丈夫。AIがあなたの学習を強力にサポートします。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
              <button 
                onClick={() => navigateTo('UPLOAD')}
                className="flex flex-col items-center p-8 bg-white border-2 border-dashed border-indigo-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
              >
                <div className="p-4 bg-indigo-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <span className="text-lg font-bold text-slate-700">授業をアップロードする</span>
                <span className="text-xs text-slate-400 mt-2">先生向け：DriveのURLや画像</span>
              </button>
              <button 
                onClick={() => navigateTo('LIST')}
                className="flex flex-col items-center p-8 bg-white border-2 border-indigo-100 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all group"
              >
                <div className="p-4 bg-emerald-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <List className="w-8 h-8 text-emerald-600" />
                </div>
                <span className="text-lg font-bold text-slate-700">要約・例題を見る</span>
                <span className="text-xs text-slate-400 mt-2">生徒向け：学習の再開</span>
              </button>
            </div>
          </div>
        );

      case 'UPLOAD':
        return <UploadView onSave={handleUpload} onBack={() => navigateTo('TOP')} isGenerating={state.isGenerating} />;

      case 'LIST':
        return (
          <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <List className="w-6 h-6 text-indigo-600" />
                授業一覧
              </h2>
              <button onClick={() => navigateTo('TOP')} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>
            {state.lessons.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-slate-400">現在公開されている授業はありません。</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {state.lessons.map(lesson => (
                  <div 
                    key={lesson.id} 
                    onClick={() => startLesson(lesson.id)}
                    className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{lesson.title}</h3>
                      <p className="text-sm text-slate-400">{lesson.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => deleteLesson(lesson.id, e)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="p-2 bg-indigo-50 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'SUMMARY':
        if (!currentLesson?.aiData) return null;
        return (
          <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 animate-in slide-in-from-right-4 duration-300">
            <header className="space-y-2">
              <span className="text-indigo-600 font-bold tracking-wider text-xs uppercase">Summary & Points</span>
              <h2 className="text-3xl font-bold text-slate-800">{currentLesson.title}</h2>
            </header>
            
            <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-600 pl-3">要約</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {currentLesson.aiData.summary}
              </p>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-l-4 border-emerald-500 pl-3">重要ポイント</h3>
              <ul className="space-y-3">
                {currentLesson.aiData.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex gap-3 sticky bottom-4">
              <button 
                onClick={() => navigateTo('LIST')}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                一覧に戻る
              </button>
              <button 
                onClick={() => navigateTo('EXERCISE')}
                className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                例題を見る
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 'EXERCISE':
        const exercise = currentLesson?.aiData?.exercises[state.currentExerciseIndex];
        if (!exercise) return null;
        return (
          <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500" 
                style={{ width: `${((state.currentExerciseIndex + 1) / (currentLesson?.aiData?.exercises.length || 1)) * 100}%` }}
              />
            </div>

            <div className="space-y-4">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                問題 {state.currentExerciseIndex + 1}
              </span>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-800 leading-relaxed text-center">
                  {exercise.question}
                </h3>
              </div>
            </div>

            <button 
              onClick={() => navigateTo('EXPLANATION')}
              className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              答えと解説を見る
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'EXPLANATION':
        const currentEx = currentLesson?.aiData?.exercises[state.currentExerciseIndex];
        const isLastEx = state.currentExerciseIndex === (currentLesson?.aiData?.exercises.length || 0) - 1;
        if (!currentEx) return null;
        return (
          <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-in zoom-in-95 duration-300">
            <header className="text-center space-y-2">
               <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Explanation</span>
               <h2 className="text-2xl font-bold text-slate-800">問題 {state.currentExerciseIndex + 1} の解説</h2>
            </header>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-3">
              <h4 className="text-emerald-800 font-bold text-sm uppercase tracking-wider">正答</h4>
              <p className="text-xl font-bold text-slate-800">{currentEx.answer}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="text-slate-400 font-bold text-sm uppercase tracking-wider">解説</h4>
              <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">{currentEx.explanation}</p>
            </div>

            <button 
              onClick={() => {
                if (isLastEx) {
                  navigateTo('FINISH');
                } else {
                  setState(prev => ({ ...prev, currentExerciseIndex: prev.currentExerciseIndex + 1, view: 'EXERCISE' }));
                }
              }}
              className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              {isLastEx ? '学習を完了する' : '次の問題へ'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'FINISH':
        return (
          <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-8 animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-emerald-500 animate-ping opacity-25"></div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-800">お疲れ様！</h2>
              <p className="text-slate-500 text-lg">今回の学習はすべて完了しました。<br/>よく頑張りましたね。</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => navigateTo('SUMMARY')}
                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all"
              >
                要約をもう一度見る
              </button>
              <button 
                onClick={() => navigateTo('LIST')}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all"
              >
                授業一覧に戻る
              </button>
            </div>
          </div>
        );

      default:
        return <div>View not implemented: {state.view}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigateTo('TOP')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight">アシスト・ラーニング</span>
          </button>
        </div>
      </nav>

      <main className="container mx-auto">
        {renderView()}
      </main>
    </div>
  );
};

interface UploadViewProps {
  onSave: (title: string, driveUrl: string, images: string[]) => void;
  onBack: () => void;
  isGenerating: boolean;
}

const UploadView: React.FC<UploadViewProps> = ({ onSave, onBack, isGenerating }) => {
  const [title, setTitle] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file instanceof Blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              setImages(prev => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !driveUrl) {
      alert("タイトルと、Google DriveのURLを入力してください。");
      return;
    }
    onSave(title, driveUrl, images);
  };

  if (isGenerating) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <div className="relative inline-block">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">URLを読み込んでいます...</h2>
          <p className="text-slate-500">Google Driveの資料を解析し、自動で文字起こしと要約を行っています。そのまま少しお待ちください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-indigo-600" />
          新規授業登録
        </h2>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">授業タイトル</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例：二次関数の基礎"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">資料のGoogle Drive URL</label>
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="url" 
              value={driveUrl}
              onChange={e => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>
          <p className="text-xs text-slate-400">※共有設定が「リンクを知っている全員」になっている資料や動画のURLを貼ってください。</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">黒板・スライド画像（任意）</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
              <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-medium">画像を追加</span>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          授業を解析して保存する
        </button>
      </form>
    </div>
  );
};

export default App;
