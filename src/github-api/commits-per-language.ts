import request from '../utils/request';

export class CommitLanguageInfo {
    name: string;
    color: string; // hexadecimal color code
    count: number;

    constructor(name: string, color: string = '#586e75', count: number) {
        this.name = name;
        this.color = color;
        this.count = count;
    }
}

export class CommitLanguages {
    private languageMap = new Map<string, CommitLanguageInfo>();

    public addLanguageCount(name: string, color: string, count: number): void {
        if (this.languageMap.has(name)) {
            const lang = this.languageMap.get(name)!;
            lang.count += count;
            this.languageMap.set(name, lang);
        } else {
            this.languageMap.set(name, new CommitLanguageInfo(name, color, count));
        }
    }

    public getLanguageMap(): Map<string, CommitLanguageInfo> {
        return this.languageMap;
    }
}

const fetcher = (token: string, variables: any) => {
  return request(
    {
      Authorization: `bearer ${token}`
    },
    {
      query: `
      query CommitLanguages($login: String!) {
        user(login: $login) {
          contributionsCollection {
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                name  // 添加仓库名用于调试
                languages(first: 100, orderBy: {field: SIZE, direction: DESC}) {
                  edges {
                    size
                    node {
                      name
                      color
                    }
                  }
                }
              }
              contributions {
                  totalCount
              }
            }
          }
        }
      }
      `,
      variables
    }
  );
};

// repos per language
export async function getCommitLanguage(username: string, exclude: Array<string>): Promise<CommitLanguages> {
  const commitLanguages = new CommitLanguages();
  const res = await fetcher(process.env.GITHUB_TOKEN!, {
    login: username
  });

  if (res.data.errors) {
    throw Error(res.data.errors[0].message || 'GetCommitLanguage failed');
  }

  res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
    (node: {
      repository: {languages: {edges: Array<{size: number; node: {name: string; color: string}}>}; name: string};
      contributions: {totalCount: number};
    }) => {
      const totalCommits = node.contributions.totalCount;
      
      if (!node.repository.languages || !node.repository.languages.edges) {
        console.warn(`仓库 ${node.repository.name} 无语言数据`);
        return;
      }

      // 计算总代码量
      const totalSize = node.repository.languages.edges.reduce((sum, edge) => sum + edge.size, 0);
      
      if (totalSize === 0) {
        console.warn(`仓库 ${node.repository.name} 代码量为 0`);
        return;
      }

      // 按语言比例分配提交数
      node.repository.languages.edges.forEach(edge => {
        const langName = edge.node.name;
        const langColor = edge.node.color;
        const langSize = edge.size;
        
        if (!exclude.includes(langName.toLowerCase())) {
          // 按比例分配提交数
          const weightedCommits = Math.round((langSize / totalSize) * totalCommits);
          if (weightedCommits > 0) {
            commitLanguages.addLanguageCount(langName, langColor, weightedCommits);
          }
        }
      });
    }
  );

  return commitLanguages;
}