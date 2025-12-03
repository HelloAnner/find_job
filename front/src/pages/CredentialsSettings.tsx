import React, { useState, useRef } from 'react';
import { Section } from '@/components/shared/Section';
import { Field } from '@/components/shared/Field';

interface CredentialResponse {
  ok: boolean;
  message: string;
  parsedCount?: number;
  identical?: boolean;
  verified?: boolean;
  sampleNames?: string[];
  lastModified?: string;
}

export const CredentialsSettings: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [checkResult, setCheckResult] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [credentialDetails, setCredentialDetails] = useState<CredentialResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setCheckResult('');

      // Read file content
      try {
        const content = await file.text();
        setFileContent(content);
      } catch (error) {
        setUploadStatus('error');
        setCheckResult('无法读取文件内容');
      }
    }
  };

  const handleFileCheck = async () => {
    if (!fileContent) return;

    setUploadStatus('checking');
    setCheckResult('');

    try {
      const response = await fetch('/api/credentials/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent }),
      });

      const result: CredentialResponse = await response.json();

      if (response.ok && result.ok) {
        setUploadStatus('success');
        setCheckResult(result.message || '文件检查通过');
        setCredentialDetails(result);
        // 只有在凭证有效且不与当前凭证相同时才显示确认对话框
        if (!result.identical) {
          setShowConfirmDialog(true);
        }
      } else {
        setUploadStatus('error');
        setCheckResult(result.message || '文件检查失败');
      }
    } catch (error) {
      setUploadStatus('error');
      setCheckResult('网络请求失败，请重试');
    }
  };

  const handleFileApply = async () => {
    if (!fileContent) return;

    try {
      const response = await fetch('/api/credentials/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent }),
      });

      const result: CredentialResponse = await response.json();

      if (response.ok && result.ok) {
        setUploadStatus('success');
        setCheckResult('登录凭证已更新成功');
        setShowConfirmDialog(false);
        setCredentialDetails(null);
        setSelectedFile(null);
        setFileContent('');
      } else {
        setUploadStatus('error');
        setCheckResult(result.message || '应用失败');
      }
    } catch (error) {
      setUploadStatus('error');
      setCheckResult('网络请求失败，请重试');
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'checking':
        return 'hourglass_empty';
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'upload';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'checking':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">登录凭证管理</h1>
        <p className="text-sm text-[#7a8a9a]">上传和管理您的登录凭证文件，确保机器人能够正常访问招聘平台。</p>
      </div>

      <Section title="凭证文件上传" description="支持上传文本格式的登录凭证文件，系统将自动检查文件安全性和有效性。">
        <Field label="选择凭证文件" hint="请上传包含登录信息的文本文件">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors border border-primary/30"
              >
                选择文件
              </button>
              {selectedFile && (
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedFile.name}
                </span>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFileCheck}
                  disabled={uploadStatus === 'checking'}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  检查文件
                </button>
                <span className={`material-symbols-outlined ${getStatusColor()}`} style={{ fontSize: 20 }}>
                  {getStatusIcon()}
                </span>
                {checkResult && (
                  <span className={`text-sm ${getStatusColor()}`}>{checkResult}</span>
                )}
              </div>
            )}
          </div>
        </Field>

        {credentialDetails && (
          <Field label="检查结果" hint="显示凭证文件的详细信息">
            <div className="bg-[var(--surface)] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500" style={{ fontSize: 18 }}>check_circle</span>
                <span>{credentialDetails.message}</span>
              </div>
              {credentialDetails.parsedCount && credentialDetails.parsedCount > 0 && (
                <div className="text-slate-600 dark:text-slate-300">
                  解析到 {credentialDetails.parsedCount} 个 Cookie
                </div>
              )}
              {credentialDetails.sampleNames && credentialDetails.sampleNames.length > 0 && (
                <div className="text-slate-600 dark:text-slate-300">
                  示例：{credentialDetails.sampleNames.join(', ')}
                </div>
              )}
              {credentialDetails.verified && (
                <div className="text-green-600 dark:text-green-400">
                  ✓ 有效性验证通过
                </div>
              )}
              {credentialDetails.identical && (
                <div className="text-amber-600 dark:text-amber-400">
                  ⚠️ 与当前凭证相同
                </div>
              )}
            </div>
          </Field>
        )}

        <Field label="当前状态" hint="显示凭证文件的当前状态">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            系统正在使用默认凭证文件
          </div>
        </Field>
      </Section>

      <Section title="使用说明" description="了解如何正确配置和使用登录凭证">
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <p>• 凭证文件应为纯文本格式（.txt）</p>
          <p>• 文件内容应包含有效的登录信息</p>
          <p>• 上传前请确保文件不包含敏感信息</p>
          <p>• 系统会自动检查文件的安全性和有效性</p>
          <p>• 检查通过后需要确认才能替换现有凭证</p>
        </div>
      </Section>

      {/* 确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">确认替换凭证</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              确定要替换当前的登录凭证吗？此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleFileApply}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                确认替换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};