export namespace main {
	
	export class FileLink {
	    path: string;
	    name: string;
	    extension: string;
	    is_folder: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileLink(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.extension = source["extension"];
	        this.is_folder = source["is_folder"];
	    }
	}
	export class Project {
	    id: string;
	    name: string;
	    client: string;
	    opponent: string;
	    lawyer: string;
	    stage: string;
	    status: string;
	    sort_order: number;
	    notes: string;
	    files: FileLink[];
	    created_at: string;
	    updated_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.client = source["client"];
	        this.opponent = source["opponent"];
	        this.lawyer = source["lawyer"];
	        this.stage = source["stage"];
	        this.status = source["status"];
	        this.sort_order = source["sort_order"];
	        this.notes = source["notes"];
	        this.files = this.convertValues(source["files"], FileLink);
	        this.created_at = source["created_at"];
	        this.updated_at = source["updated_at"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

