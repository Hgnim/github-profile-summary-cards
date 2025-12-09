import request from '../utils/request';

export class RepoLanguageInfo {
    name: string;
    color: string; // hexadecimal color code
    count: number;

    constructor(name: string, color: string = '#586e75', count: number) {
        this.name = name;
        this.color = color;
        this.count = count;
    }
}

export class RepoLanguages {
    private languageMap = new Map<string, RepoLanguageInfo>();

    public addLanguage(name: string, color: string, size: number = 1): void {
        if (this.languageMap.has(name)) {
            const lang = this.languageMap.get(name)!;
            lang.count += size;  // 按字节数累加
            this.languageMap.set(name, lang);
        } else {
            this.languageMap.set(name, new RepoLanguageInfo(name, color, size));
        }
    }

    public getLanguageMap(): Map<string, RepoLanguageInfo> {
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
        query ReposPerLanguage($login: String!,$endCursor: String) {
          user(login: $login) {
            repositories(isFork: false, first: 100, after: $endCursor, ownerAffiliations: OWNER) {
              nodes {
                languages(first: 100, orderBy: {field: SIZE, direction: DESC}) {  // ← 获取所有语言
                  edges {
                    size  // 代码字节数
                    node {
                      name
                      color
                    }
                  }
                }
              }
              pageInfo {
                endCursor
                hasNextPage
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
export async function getRepoLanguages(username: string, exclude: Array<string>): Promise<RepoLanguages> {
    let hasNextPage = true;
    let cursor = null;
    const repoLanguages = new RepoLanguages();
    const nodes = [];

    while (hasNextPage) {
        const res: any = await fetcher(process.env.GITHUB_TOKEN!, {
            login: username,
            endCursor: cursor
        });

        if (res.data.errors) {
            throw Error(res.data.errors[0].message || 'GetRepoLanguage fail');
        }
        cursor = res.data.data.user.repositories.pageInfo.endCursor;
        hasNextPage = res.data.data.user.repositories.pageInfo.hasNextPage;
        nodes.push(...res.data.data.user.repositories.nodes);
    }

    nodes.forEach(node => {
        if (node.languages && node.languages.edges) {
            node.languages.edges.forEach(edge => {
                const langName = edge.node.name;
                const langColor = edge.node.color;
                const langSize = edge.size;  // 按代码量加权
                
                if (!exclude.includes(langName.toLowerCase())) {
                    // 需要修改 addLanguage 方法支持加权
                    repoLanguages.addLanguage(langName, langColor, langSize);
                }
            });
        }
    });

    return repoLanguages;
}
